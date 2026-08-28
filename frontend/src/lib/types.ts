/**
 * Response shapes returned by the TourNexus FastAPI backend.
 *
 * These mirror the Pydantic schemas in backend/app/schemas. If a field
 * changes there, change it here - that is the point of having one file
 * rather than untyped objects scattered through components.
 */

export type Role = 'tourist' | 'authority';

export type CrowdLevel = 'low' | 'medium' | 'high' | 'critical';

export type ImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Destination {
  id: number;
  name: string;
  description: string | null;
  city: string;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Attraction {
  id: number;
  destination_id: number;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Service {
  id: number;
  destination_id: number;
  name: string;
  service_type: string;
  description: string | null;
  capacity: number | null;
  current_load: number | null;
  unit: string | null;
  status: string;
  source: string;
  confidence: number;
  load_ratio: number | null;
}

export interface CrowdReading {
  id: number;
  attraction_id: number;
  timestamp: string;
  estimated_visitors: number;
  capacity: number;
  crowd_score: number;
  crowd_level: CrowdLevel;
  source: string;
}

export interface Disruption {
  id: number;
  attraction_id: number | null;
  disruption_type: string;
  status: string;
  description: string | null;
  started_at: string;
  resolved_at: string | null;
}

export interface Hotel {
  id: number;
  destination_id: number;
  name: string;
  rating: number | null;
  status: string;
}

export interface Restaurant {
  id: number;
  destination_id: number;
  name: string;
  cuisine: string | null;
  rating: number | null;
  status: string;
}

export interface Transport {
  id: number;
  destination_id: number;
  name: string;
  transport_type: string;
  status: string;
}

export interface TourismEvent {
  id: number;
  destination_id: number;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  expected_attendance: number | null;
  status: string;
}

export interface Itinerary {
  id: number;
  tourist_id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface ItineraryItem {
  id: number;
  itinerary_id: number;
  entity_type: string;
  entity_id: number;
  visit_start: string | null;
  visit_end: string | null;
  sequence_order: number;
}

export interface Overview {
  destination_health: number;
  destination_health_label: string;
  average_crowd_score: number;
  estimated_visitors: number;
  total_capacity: number;
  utilisation: number;
  attraction_count: number;
  monitored_attractions: number;
  active_disruption_count: number;
  crowd_level_counts: Record<CrowdLevel, number>;
  hotel_count: number;
  restaurant_count: number;
  transport_count: number;
}

export interface GraphNode {
  id: string;
  type: string;
  entity_id: number | null;
  label: string;
  crowd_score: number | null;
  crowd_level: CrowdLevel | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight: number;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
}

export interface InterventionOption {
  key: string;
  rank: number;
  name: string;
  description: string;
  owner: string;
  cost_label: string;
  cost_index: number;
  lead_time_hours: number;
  tags: string[];
  reach: number;
  effectiveness: number;
  impact_label: string;
  score: number;
  covered_nodes: string[];
  covered_count: number;
}

export interface AffectedNode {
  id: string;
  label: string;
  depth: number;
}

export interface ChainLink {
  source: string;
  target: string;
  source_label: string;
  target_label: string;
}

export interface ImpactReport {
  disrupted_node: string;
  disrupted_label: string;
  impact_level: ImpactLevel;
  affected_count: number;
  max_depth: number;
  affected_nodes: AffectedNode[];
  dependency_chain: ChainLink[];
  interventions: InterventionOption[];
}

export interface RippleAnalysis {
  disrupted_node: string;
  affected_nodes: string[];
  dependency_chain: [string, string][];
  depths: Record<string, number>;
  affected_count: number;
  max_depth: number;
  impact_level: ImpactLevel;
}

export interface AlternativePaths {
  source: string;
  target: string;
  disrupted_node: string;
  alternative_paths: string[][];
  alternative_count: number;
}
