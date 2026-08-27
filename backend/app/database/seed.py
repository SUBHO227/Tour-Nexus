"""
Seed the database with a working Odisha scenario.

This is the Puri festival case from Section 6 of the concept document,
expressed as real rows so every dashboard has something true to render.
Run it with:

    python -m app.database.seed

It is idempotent - running it again resets the seeded tables first.
"""

from datetime import datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.connection import SessionLocal
from app.database.init_db import init_db
from app.models import (
    Attraction,
    CrowdData,
    Dependency,
    Destination,
    Disruption,
    Event,
    Hotel,
    Itinerary,
    ItineraryItem,
    Restaurant,
    Service,
    Transport,
    User,
)
from app.services.crowd_service import calculate_crowd_score, get_crowd_level


NOW = datetime.utcnow()


def _clear(db: Session) -> None:
    for model in (
        ItineraryItem,
        Itinerary,
        CrowdData,
        Disruption,
        Dependency,
        Event,
        Transport,
        Restaurant,
        Hotel,
        Service,
        Attraction,
        Destination,
        User,
    ):
        db.execute(delete(model))

    db.commit()


def seed() -> None:
    init_db()

    db = SessionLocal()

    try:
        _clear(db)

        # -- Users ------------------------------------------------------
        tourist = User(
            email="tourist@tournexus.in",
            password_hash=hash_password("tourist123"),
            full_name="Ananya Mishra",
            role="tourist",
        )

        authority = User(
            email="authority@tournexus.in",
            password_hash=hash_password("authority123"),
            full_name="Odisha Tourism Control Room",
            role="authority",
        )

        db.add_all([tourist, authority])
        db.flush()

        # -- Destinations -----------------------------------------------
        puri = Destination(
            name="Puri",
            description=(
                "Coastal temple town on the Bay of Bengal, home to the "
                "Jagannath Temple and the Rath Yatra."
            ),
            city="Puri",
            state="Odisha",
        )

        konark = Destination(
            name="Konark",
            description=(
                "Site of the 13th-century Sun Temple, a UNESCO World "
                "Heritage monument built as a colossal stone chariot."
            ),
            city="Konark",
            state="Odisha",
        )

        bhubaneswar = Destination(
            name="Bhubaneswar",
            description=(
                "Odisha's capital and temple city, the usual arrival point "
                "for the Golden Triangle circuit."
            ),
            city="Bhubaneswar",
            state="Odisha",
        )

        db.add_all([puri, konark, bhubaneswar])
        db.flush()

        # -- Attractions ------------------------------------------------
        attractions = [
            Attraction(
                destination_id=puri.id,
                name="Shree Jagannath Temple",
                description=(
                    "12th-century temple and the centre of Puri's pilgrim "
                    "footfall."
                ),
                category="Temple",
                status="open",
            ),
            Attraction(
                destination_id=puri.id,
                name="Puri Beach",
                description="Wide golden beach along the Bay of Bengal.",
                category="Beach",
                status="open",
            ),
            Attraction(
                destination_id=puri.id,
                name="Gundicha Temple",
                description=(
                    "Destination temple of the Rath Yatra chariot procession."
                ),
                category="Temple",
                status="open",
            ),
            Attraction(
                destination_id=puri.id,
                name="Chilika Lake (Satapada)",
                description=(
                    "Asia's largest brackish water lagoon, known for "
                    "Irrawaddy dolphins."
                ),
                category="Nature",
                status="open",
            ),
            Attraction(
                destination_id=konark.id,
                name="Konark Sun Temple",
                description=(
                    "UNESCO World Heritage Site shaped as the chariot of "
                    "the sun god Surya."
                ),
                category="Heritage",
                status="open",
            ),
            Attraction(
                destination_id=konark.id,
                name="Chandrabhaga Beach",
                description=(
                    "Quiet beach three kilometres from the Sun Temple."
                ),
                category="Beach",
                status="open",
            ),
            Attraction(
                destination_id=bhubaneswar.id,
                name="Lingaraj Temple",
                description="11th-century temple, the largest in Bhubaneswar.",
                category="Temple",
                status="open",
            ),
            Attraction(
                destination_id=bhubaneswar.id,
                name="Udayagiri and Khandagiri Caves",
                description=(
                    "Rock-cut Jain caves dating to the 2nd century BCE."
                ),
                category="Heritage",
                status="open",
            ),
            Attraction(
                destination_id=bhubaneswar.id,
                name="Nandankanan Zoological Park",
                description=(
                    "Zoo and botanical garden with a white tiger safari."
                ),
                category="Nature",
                status="open",
            ),
        ]

        db.add_all(attractions)
        db.flush()

        by_name = {a.name: a for a in attractions}

        # -- Civic services (the dependency-graph backbone) -------------
        services = [
            Service(
                destination_id=puri.id,
                name="Grand Road Parking Complex",
                service_type="parking",
                description=(
                    "Main visitor parking serving the temple precinct."
                ),
                capacity=2000,
                current_load=1880,
                unit="vehicles",
                status="operational",
                source="Tourism Authority",
                confidence=0.9,
            ),
            Service(
                destination_id=puri.id,
                name="Grand Road Corridor",
                service_type="road",
                description="Primary approach road to the Jagannath Temple.",
                capacity=4500,
                current_load=4200,
                unit="vehicles/hour",
                status="congested",
                source="Traffic Police",
                confidence=0.75,
            ),
            Service(
                destination_id=puri.id,
                name="Puri Sanitation Zone A",
                service_type="sanitation",
                description=(
                    "Public toilet blocks around the temple precinct."
                ),
                capacity=120,
                current_load=104,
                unit="units",
                status="operational",
                source="Municipal Corporation",
                confidence=0.6,
            ),
            Service(
                destination_id=puri.id,
                name="Puri Waste Collection",
                service_type="waste",
                description="Daily solid waste collection for the core zone.",
                capacity=45,
                current_load=39,
                unit="tonnes/day",
                status="operational",
                source="Municipal Corporation",
                confidence=0.65,
            ),
            Service(
                destination_id=puri.id,
                name="Puri Water Supply",
                service_type="water",
                description="Piped water supply to the pilgrim zone.",
                capacity=30,
                current_load=22,
                unit="MLD",
                status="operational",
                source="PHED",
                confidence=0.7,
            ),
            Service(
                destination_id=konark.id,
                name="Sun Temple Parking",
                service_type="parking",
                description="Visitor parking at the Konark monument gate.",
                capacity=600,
                current_load=310,
                unit="vehicles",
                status="operational",
                source="ASI",
                confidence=0.8,
            ),
            Service(
                destination_id=konark.id,
                name="Konark Marine Drive",
                service_type="road",
                description="Coastal road linking Puri and Konark.",
                capacity=1800,
                current_load=1150,
                unit="vehicles/hour",
                status="operational",
                source="Traffic Police",
                confidence=0.7,
            ),
            Service(
                destination_id=bhubaneswar.id,
                name="Bhubaneswar Airport Transfer Hub",
                service_type="transport_hub",
                description=(
                    "Arrival hub feeding the Golden Triangle circuit."
                ),
                capacity=9000,
                current_load=5400,
                unit="passengers/day",
                status="operational",
                source="Airport Authority",
                confidence=0.85,
            ),
        ]

        db.add_all(services)
        db.flush()

        svc = {s.name: s for s in services}

        # -- Hotels, restaurants, transport, events ---------------------
        db.add_all(
            [
                Hotel(
                    destination_id=puri.id,
                    name="Mayfair Heritage Puri",
                    rating=4.6,
                    status="available",
                ),
                Hotel(
                    destination_id=puri.id,
                    name="Hotel Sea Palace",
                    rating=4.0,
                    status="available",
                ),
                Hotel(
                    destination_id=puri.id,
                    name="Hotel Grand Road Residency",
                    rating=3.7,
                    status="full",
                ),
                Hotel(
                    destination_id=konark.id,
                    name="Yatri Nivas Konark",
                    rating=3.9,
                    status="available",
                ),
                Hotel(
                    destination_id=bhubaneswar.id,
                    name="Trident Bhubaneswar",
                    rating=4.7,
                    status="available",
                ),
                Hotel(
                    destination_id=bhubaneswar.id,
                    name="Swosti Grand",
                    rating=4.3,
                    status="available",
                ),
            ]
        )

        db.add_all(
            [
                Restaurant(
                    destination_id=puri.id,
                    name="Wildgrass Restaurant",
                    cuisine="Odia",
                    rating=4.5,
                    status="open",
                ),
                Restaurant(
                    destination_id=puri.id,
                    name="Chung Wah",
                    cuisine="Chinese",
                    rating=4.1,
                    status="open",
                ),
                Restaurant(
                    destination_id=puri.id,
                    name="Ananda Bhawan",
                    cuisine="Vegetarian",
                    rating=4.2,
                    status="open",
                ),
                Restaurant(
                    destination_id=konark.id,
                    name="Geetanjali Dhaba",
                    cuisine="Odia",
                    rating=3.8,
                    status="open",
                ),
                Restaurant(
                    destination_id=bhubaneswar.id,
                    name="Dalma",
                    cuisine="Odia",
                    rating=4.4,
                    status="open",
                ),
                Restaurant(
                    destination_id=bhubaneswar.id,
                    name="Kanika",
                    cuisine="Multi-cuisine",
                    rating=4.6,
                    status="open",
                ),
            ]
        )

        transports = [
            Transport(
                destination_id=puri.id,
                name="Puri Temple Shuttle Loop",
                transport_type="shuttle",
                status="available",
            ),
            Transport(
                destination_id=puri.id,
                name="Puri Auto-Rickshaw Stand",
                transport_type="auto",
                status="available",
            ),
            Transport(
                destination_id=puri.id,
                name="Puri Railway Station",
                transport_type="rail",
                status="available",
            ),
            Transport(
                destination_id=konark.id,
                name="Konark-Puri Bus Service",
                transport_type="bus",
                status="delayed",
            ),
            Transport(
                destination_id=bhubaneswar.id,
                name="Biju Patnaik International Airport",
                transport_type="air",
                status="available",
            ),
            Transport(
                destination_id=bhubaneswar.id,
                name="Bhubaneswar Cab Fleet",
                transport_type="cab",
                status="available",
            ),
        ]

        db.add_all(transports)
        db.flush()

        trn = {t.name: t for t in transports}

        db.add_all(
            [
                Event(
                    destination_id=puri.id,
                    name="Rath Yatra Chariot Festival",
                    description=(
                        "Annual chariot procession drawing very large "
                        "pilgrim crowds to the Grand Road."
                    ),
                    start_time=NOW + timedelta(days=2),
                    end_time=NOW + timedelta(days=11),
                    expected_attendance=30000,
                    status="scheduled",
                ),
                Event(
                    destination_id=konark.id,
                    name="Konark Dance Festival",
                    description=(
                        "Classical dance festival held against the Sun "
                        "Temple."
                    ),
                    start_time=NOW + timedelta(days=20),
                    end_time=NOW + timedelta(days=25),
                    expected_attendance=6000,
                    status="scheduled",
                ),
                Event(
                    destination_id=bhubaneswar.id,
                    name="Odisha Handicrafts Mela",
                    description="State crafts fair at the exhibition grounds.",
                    start_time=NOW + timedelta(days=5),
                    end_time=NOW + timedelta(days=12),
                    expected_attendance=4000,
                    status="scheduled",
                ),
            ]
        )

        # -- Crowd readings ---------------------------------------------
        crowd_inputs = [
            ("Shree Jagannath Temple", 8600, 9000, "Gate Counter"),
            ("Puri Beach", 4200, 12000, "Estimated"),
            ("Gundicha Temple", 2100, 4000, "Gate Counter"),
            ("Chilika Lake (Satapada)", 900, 2500, "Boat Registry"),
            ("Konark Sun Temple", 3400, 5000, "ASI Ticketing"),
            ("Chandrabhaga Beach", 700, 4000, "Estimated"),
            ("Lingaraj Temple", 2600, 6000, "Gate Counter"),
            ("Udayagiri and Khandagiri Caves", 800, 3000, "ASI Ticketing"),
            ("Nandankanan Zoological Park", 4100, 8000, "Ticketing"),
        ]

        for name, visitors, capacity, source in crowd_inputs:
            score = calculate_crowd_score(visitors, capacity)

            db.add(
                CrowdData(
                    attraction_id=by_name[name].id,
                    timestamp=NOW - timedelta(minutes=12),
                    estimated_visitors=visitors,
                    capacity=capacity,
                    crowd_score=score,
                    crowd_level=get_crowd_level(score),
                    source=source,
                )
            )

            # A little history so the charts have a trend to draw.
            for hours_ago in (2, 4, 6, 8):
                past_visitors = max(
                    0,
                    int(visitors * (0.55 + 0.05 * (8 - hours_ago))),
                )
                past_score = calculate_crowd_score(past_visitors, capacity)

                db.add(
                    CrowdData(
                        attraction_id=by_name[name].id,
                        timestamp=NOW - timedelta(hours=hours_ago),
                        estimated_visitors=past_visitors,
                        capacity=capacity,
                        crowd_score=past_score,
                        crowd_level=get_crowd_level(past_score),
                        source=source,
                    )
                )

        # -- Active disruptions -----------------------------------------
        db.add_all(
            [
                Disruption(
                    attraction_id=by_name["Shree Jagannath Temple"].id,
                    disruption_type="Overcrowding",
                    status="active",
                    description=(
                        "Darshan queue exceeding managed capacity; entry "
                        "being regulated in batches."
                    ),
                    started_at=NOW - timedelta(hours=3),
                ),
                Disruption(
                    attraction_id=by_name["Konark Sun Temple"].id,
                    disruption_type="Partial Closure",
                    status="active",
                    description=(
                        "Conservation work on the north face; a section of "
                        "the compound is fenced off."
                    ),
                    started_at=NOW - timedelta(days=1),
                ),
                Disruption(
                    attraction_id=by_name["Chilika Lake (Satapada)"].id,
                    disruption_type="Weather Advisory",
                    status="active",
                    description=(
                        "Boat operations suspended until afternoon due to "
                        "high winds over the lagoon."
                    ),
                    started_at=NOW - timedelta(hours=6),
                ),
                Disruption(
                    attraction_id=by_name["Puri Beach"].id,
                    disruption_type="Road Closure",
                    status="resolved",
                    description=(
                        "Marine Drive cleared after the morning procession."
                    ),
                    started_at=NOW - timedelta(days=2),
                    resolved_at=NOW - timedelta(days=1, hours=8),
                ),
            ]
        )

        # -- The dependency graph ---------------------------------------
        # The cascade from Section 1 of the concept document:
        # Parking -> Road -> Transport -> Attraction -> Sanitation / Waste

        def dep(src_type, src_id, tgt_type, tgt_id, relationship, weight):
            return Dependency(
                source_type=src_type,
                source_id=src_id,
                target_type=tgt_type,
                target_id=tgt_id,
                relationship=relationship,
                weight=weight,
            )

        jagannath = by_name["Shree Jagannath Temple"]
        gundicha = by_name["Gundicha Temple"]
        puri_beach = by_name["Puri Beach"]
        chilika = by_name["Chilika Lake (Satapada)"]
        sun_temple = by_name["Konark Sun Temple"]
        chandrabhaga = by_name["Chandrabhaga Beach"]
        lingaraj = by_name["Lingaraj Temple"]

        parking = svc["Grand Road Parking Complex"]
        grand_road = svc["Grand Road Corridor"]
        sanitation = svc["Puri Sanitation Zone A"]
        waste = svc["Puri Waste Collection"]
        water = svc["Puri Water Supply"]
        konark_parking = svc["Sun Temple Parking"]
        marine_drive = svc["Konark Marine Drive"]
        airport_hub = svc["Bhubaneswar Airport Transfer Hub"]

        shuttle = trn["Puri Temple Shuttle Loop"]
        autos = trn["Puri Auto-Rickshaw Stand"]
        railway = trn["Puri Railway Station"]
        konark_bus = trn["Konark-Puri Bus Service"]
        cabs = trn["Bhubaneswar Cab Fleet"]

        db.add_all(
            [
                # Puri core cascade
                dep("service", parking.id, "service", grand_road.id,
                    "overflow_increases_congestion", 0.9),
                dep("service", grand_road.id, "transport", shuttle.id,
                    "congestion_delays_service", 0.85),
                dep("service", grand_road.id, "transport", autos.id,
                    "congestion_delays_service", 0.7),
                dep("transport", shuttle.id, "attraction", jagannath.id,
                    "delivers_visitors_to", 0.8),
                dep("transport", autos.id, "attraction", jagannath.id,
                    "delivers_visitors_to", 0.6),
                dep("transport", railway.id, "service", parking.id,
                    "arrivals_increase_demand", 0.55),
                dep("attraction", jagannath.id, "service", sanitation.id,
                    "footfall_increases_load", 0.75),
                dep("attraction", jagannath.id, "service", waste.id,
                    "footfall_increases_load", 0.7),
                dep("attraction", jagannath.id, "service", water.id,
                    "footfall_increases_load", 0.5),
                dep("attraction", jagannath.id, "attraction", gundicha.id,
                    "visitor_spillover", 0.6),
                dep("attraction", jagannath.id, "attraction", puri_beach.id,
                    "visitor_spillover", 0.45),
                dep("attraction", gundicha.id, "service", sanitation.id,
                    "footfall_increases_load", 0.4),
                dep("attraction", puri_beach.id, "service", waste.id,
                    "footfall_increases_load", 0.5),

                # Puri -> Konark corridor
                dep("service", grand_road.id, "service", marine_drive.id,
                    "spills_traffic_onto", 0.6),
                dep("service", marine_drive.id, "transport", konark_bus.id,
                    "congestion_delays_service", 0.75),
                dep("transport", konark_bus.id, "attraction", sun_temple.id,
                    "delivers_visitors_to", 0.8),
                dep("service", konark_parking.id, "service", marine_drive.id,
                    "overflow_increases_congestion", 0.65),
                dep("attraction", sun_temple.id, "attraction",
                    chandrabhaga.id, "visitor_spillover", 0.5),

                # Bhubaneswar inbound
                dep("service", airport_hub.id, "transport", cabs.id,
                    "arrivals_increase_demand", 0.7),
                dep("transport", cabs.id, "attraction", lingaraj.id,
                    "delivers_visitors_to", 0.6),
                dep("transport", cabs.id, "service", parking.id,
                    "arrivals_increase_demand", 0.5),
                dep("attraction", lingaraj.id, "attraction", chilika.id,
                    "circuit_continues_to", 0.35),
            ]
        )

        # -- A tourist itinerary ----------------------------------------
        itinerary = Itinerary(
            tourist_id=tourist.id,
            title="Odisha Golden Triangle - 4 Days",
            start_date=(NOW + timedelta(days=1)).date(),
            end_date=(NOW + timedelta(days=4)).date(),
            status="active",
        )

        db.add(itinerary)
        db.flush()

        plan = [
            (lingaraj.id, 1, 9, 11),
            (by_name["Udayagiri and Khandagiri Caves"].id, 2, 12, 14),
            (sun_temple.id, 3, 10, 13),
            (chandrabhaga.id, 4, 14, 16),
            (jagannath.id, 5, 7, 10),
            (puri_beach.id, 6, 17, 19),
            (chilika.id, 7, 8, 12),
        ]

        for entity_id, order, start_hour, end_hour in plan:
            day = (order - 1) // 2

            base = (NOW + timedelta(days=1 + day)).replace(
                minute=0, second=0, microsecond=0
            )

            db.add(
                ItineraryItem(
                    itinerary_id=itinerary.id,
                    entity_type="attraction",
                    entity_id=entity_id,
                    visit_start=base.replace(hour=start_hour),
                    visit_end=base.replace(hour=end_hour),
                    sequence_order=order,
                )
            )

        db.commit()

        print("Seed complete.")
        print("  destinations : 3")
        print(f"  attractions  : {len(attractions)}")
        print(f"  services     : {len(services)}")
        print("  logins       : tourist@tournexus.in / tourist123")
        print("                 authority@tournexus.in / authority123")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
