/**
 * Spatial Grid Clustering Utility for StreetWatch
 * Groups points that are close to each other into clusters, or leaves them as individual points.
 */

export interface ClusterItem {
  id: string;
  latitude: number;
  longitude: number;
  priorityScore: number;
  status: string;
}

export interface ClusteredGroup<T extends ClusterItem> {
  id: string;
  isCluster: true;
  latitude: number;
  longitude: number;
  count: number;
  highestPriority: number;
  items: T[];
}

export interface SingleItem<T extends ClusterItem> {
  id: string;
  isCluster: false;
  item: T;
  latitude: number;
  longitude: number;
}

export type SpatialMapEntity<T extends ClusterItem> = ClusteredGroup<T> | SingleItem<T>;

/**
 * Clusters points within threshold distance in meters (~0.0008 deg ≈ 85m in Dhaka)
 */
export function clusterGeospatialPoints<T extends ClusterItem>(
  points: T[],
  clusterRadiusMeters: number = 75
): SpatialMapEntity<T>[] {
  if (!points || points.length === 0) return [];

  // Approximate meters per degree latitude at 23.8 deg N: ~110,574m
  // Longitude degree: ~111,320m * cos(23.8 deg) ≈ 101,800m
  const latFactor = 110574;
  const lngFactor = 101800;

  const visited = new Set<string>();
  const results: SpatialMapEntity<T>[] = [];

  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    if (visited.has(pt.id)) continue;

    visited.add(pt.id);
    const clusterItems: T[] = [pt];

    for (let j = i + 1; j < points.length; j++) {
      const candidate = points[j];
      if (visited.has(candidate.id)) continue;

      const dLat = (candidate.latitude - pt.latitude) * latFactor;
      const dLng = (candidate.longitude - pt.longitude) * lngFactor;
      const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);

      if (distMeters <= clusterRadiusMeters) {
        visited.add(candidate.id);
        clusterItems.push(candidate);
      }
    }

    if (clusterItems.length > 1) {
      // Calculate centroid
      const avgLat =
        clusterItems.reduce((acc, c) => acc + c.latitude, 0) / clusterItems.length;
      const avgLng =
        clusterItems.reduce((acc, c) => acc + c.longitude, 0) / clusterItems.length;
      const maxPriority = Math.max(...clusterItems.map((c) => c.priorityScore));

      results.push({
        id: `cluster-${pt.id}-${clusterItems.length}`,
        isCluster: true,
        latitude: avgLat,
        longitude: avgLng,
        count: clusterItems.length,
        highestPriority: maxPriority,
        items: clusterItems,
      });
    } else {
      results.push({
        id: pt.id,
        isCluster: false,
        item: pt,
        latitude: pt.latitude,
        longitude: pt.longitude,
      });
    }
  }

  return results;
}
