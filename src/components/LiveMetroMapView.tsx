import React, { useState, useEffect, useRef } from 'react';
import { Trainset } from '../types';
import { KOCHI_METRO_STATIONS, MetroStation, MUTTOM_DEPOT_COORD } from '../data/metroLineData';
import { MapPin, Navigation, Gauge, Users, Clock, Zap, Layers, RefreshCw, AlertCircle, ChevronRight, Play, Pause, FastForward, ArrowUpRight, ArrowDownRight, Compass, ShieldCheck, ToggleLeft, ToggleRight, X, AlertTriangle, Calendar, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { KochiMetroLogo } from './KochiMetroLogo';
import L from 'leaflet';

// Import Leaflet CSS dynamically or rely on standard stylesheet
import 'leaflet/dist/leaflet.css';

interface LiveMetroMapViewProps {
  fleet: Trainset[];
  onSelectTrain?: (train: Trainset) => void;
  dateStationsStatus?: Record<string, Record<string, { isOperational: boolean; reason?: string }>>;
  onToggleStationStatusDate?: (date: string, stationId: string, isOperational: boolean, reason?: string) => void;
  stationsStatus?: Record<string, { isOperational: boolean; reason?: string }>;
  onToggleStationStatus?: (stationId: string, isOperational: boolean, reason?: string) => void;
}

export interface ActiveTrainState {
  train: Trainset;
  fromStationIndex: number; // 0 to 23
  toStationIndex: number;   // 1 to 24
  progress: number;        // 0.0 to 1.0 between from & to
  direction: 'DOWN' | 'UP'; // DOWN = Aluva -> Thrippunithura, UP = Thrippunithura -> Aluva
  speedKmh: number;
  occupancyPercent: number;
  driverName: string;
  delayMinutes: number;    // e.g. 0 = on time, +0.5 = minor delay
}

const DRIVER_NAMES = [
  "Rajesh V. Nair", "Anil Kumar P.", "Deepa S. Pillai", "Sujith Kurup",
  "Vishnu Prasad", "Meera Menon", "Karthik R.", "Aswathy B.",
  "Manoj K. Varghese", "Siddharth Shenoy", "Nisha Mohan", "Rahul K."
];

export const LiveMetroMapView: React.FC<LiveMetroMapViewProps> = ({
  fleet,
  onSelectTrain,
  dateStationsStatus = {},
  onToggleStationStatusDate,
  stationsStatus = {},
  onToggleStationStatus,
}) => {
  const [viewMode, setViewMode] = useState<'GEOGRAPHIC' | 'SCHEMATIC'>('GEOGRAPHIC');
  const [simSpeed, setSimSpeed] = useState<number>(1); // 1x, 2x, 5x
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<MetroStation | null>(null);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'DOWN' | 'UP'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isStationManagerOpen, setIsStationManagerOpen] = useState<boolean>(false);
  const [schematicZoom, setSchematicZoom] = useState<number>(1);

  // Helper to fit map bounds to cover all 25 stations (Full Metro Line)
  const handleFitFullMap = () => {
    setSelectedStation(null);
    setSelectedTrainId(null);
    if (viewMode === 'GEOGRAPHIC' && leafletMapRef.current) {
      const bounds = L.latLngBounds(
        KOCHI_METRO_STATIONS.map(st => [st.lat, st.lng] as [number, number])
      );
      bounds.extend([MUTTOM_DEPOT_COORD.lat, MUTTOM_DEPOT_COORD.lng]);
      leafletMapRef.current.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 14,
        animate: true,
        duration: 1.0,
      });
    } else {
      setSchematicZoom(1);
    }
  };

  // Helper to zoom in on active view
  const handleZoomIn = () => {
    if (viewMode === 'GEOGRAPHIC' && leafletMapRef.current) {
      leafletMapRef.current.zoomIn();
    } else {
      setSchematicZoom(prev => Math.min(prev + 0.2, 2.5));
    }
  };

  // Helper to zoom out on active view
  const handleZoomOut = () => {
    if (viewMode === 'GEOGRAPHIC' && leafletMapRef.current) {
      leafletMapRef.current.zoomOut();
    } else {
      setSchematicZoom(prev => Math.max(prev - 0.2, 0.5));
    }
  };

  // Helper to focus on Muttom Depot
  const handleFocusDepot = () => {
    if (viewMode === 'GEOGRAPHIC' && leafletMapRef.current) {
      leafletMapRef.current.flyTo([MUTTOM_DEPOT_COORD.lat, MUTTOM_DEPOT_COORD.lng], 16, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  // Helper to select and fly to a station on the Leaflet map
  const handleSelectStation = (station: MetroStation) => {
    setSelectedStation(station);
    setSelectedTrainId(null);
    if (viewMode === 'GEOGRAPHIC' && leafletMapRef.current) {
      leafletMapRef.current.flyTo([station.lat, station.lng], 15, {
        animate: true,
        duration: 1.2,
      });
    }
  };

  // Helper to select and fly to an active train on the Leaflet map
  const handleSelectTrain = (trainId: string) => {
    setSelectedTrainId(trainId);
    setSelectedStation(null);
    const activeT = activeTrains.find(t => t.train.id.toLowerCase() === trainId.toLowerCase());
    if (activeT && viewMode === 'GEOGRAPHIC' && leafletMapRef.current) {
      const s1 = KOCHI_METRO_STATIONS[activeT.fromStationIndex];
      const s2 = KOCHI_METRO_STATIONS[activeT.toStationIndex];
      if (s1 && s2) {
        const curLat = s1.lat + (s2.lat - s1.lat) * activeT.progress;
        const curLng = s1.lng + (s2.lng - s1.lng) * activeT.progress;
        leafletMapRef.current.flyTo([curLat, curLng], 15, {
          animate: true,
          duration: 1.2,
        });
      }
    }
  };

  // Selected Calendar Date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const mapLinesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const mapStationsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Helpers for calendar date labels and status
  const formatDateLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };
  const getDayAfterStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  };
  const getWeekendStr = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  };

  const getStationStatus = (stationId: string, dateStr: string = selectedDate) => {
    if (dateStationsStatus && dateStationsStatus[dateStr] && dateStationsStatus[dateStr][stationId]) {
      return dateStationsStatus[dateStr][stationId];
    }
    if (stationsStatus && stationsStatus[stationId]) {
      return stationsStatus[stationId];
    }
    return { isOperational: true };
  };

  const isStationOperational = (stationIdx: number, dateStr: string = selectedDate) => {
    const station = KOCHI_METRO_STATIONS[stationIdx];
    if (!station) return false;
    return getStationStatus(station.id, dateStr).isOperational !== false;
  };

  const handleToggleStationForDate = (stationId: string, isOperational: boolean, reason?: string) => {
    if (onToggleStationStatusDate) {
      onToggleStationStatusDate(selectedDate, stationId, isOperational, reason);
    } else if (onToggleStationStatus) {
      onToggleStationStatus(stationId, isOperational, reason);
    }
  };

  // Get only IN_SERVICE trainsets
  const inServiceTrains = fleet.filter(t => t.currentStatus === 'IN_SERVICE');

  // Initialize animated train positions
  const [activeTrains, setActiveTrains] = useState<ActiveTrainState[]>(() => {
    return inServiceTrains.map((train, idx) => {
      const isDown = idx % 2 === 0;
      const startSeg = Math.floor((idx / inServiceTrains.length) * (KOCHI_METRO_STATIONS.length - 1));
      const fromIdx = isDown ? startSeg : startSeg + 1;
      const toIdx = isDown ? startSeg + 1 : startSeg;
      const progress = (idx * 0.17) % 0.9;

      return {
        train,
        fromStationIndex: Math.min(fromIdx, KOCHI_METRO_STATIONS.length - 1),
        toStationIndex: Math.min(Math.max(0, toIdx), KOCHI_METRO_STATIONS.length - 1),
        progress,
        direction: isDown ? 'DOWN' : 'UP',
        speedKmh: Math.floor(40 + Math.random() * 25),
        occupancyPercent: Math.floor(35 + Math.random() * 50),
        driverName: DRIVER_NAMES[idx % DRIVER_NAMES.length],
        delayMinutes: Math.random() > 0.8 ? 0.5 : 0,
      };
    });
  });

  // Animation Loop - Constrained strictly to active lines for chosen calendar date
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setActiveTrains(prev => {
        return prev.map(pt => {
          const step = (0.012 * simSpeed);
          let nextProg = pt.progress + step;
          let newFrom = pt.fromStationIndex;
          let newTo = pt.toStationIndex;
          let newDir = pt.direction;

          // Ensure current station is operational on selectedDate
          if (!isStationOperational(newFrom, selectedDate)) {
            let nearestOp = newFrom;
            for (let offset = 1; offset < KOCHI_METRO_STATIONS.length; offset++) {
              if (newFrom + offset < KOCHI_METRO_STATIONS.length && isStationOperational(newFrom + offset, selectedDate)) {
                nearestOp = newFrom + offset;
                break;
              }
              if (newFrom - offset >= 0 && isStationOperational(newFrom - offset, selectedDate)) {
                nearestOp = newFrom - offset;
                break;
              }
            }
            newFrom = nearestOp;
            newTo = newDir === 'DOWN' ? Math.min(KOCHI_METRO_STATIONS.length - 1, newFrom + 1) : Math.max(0, newFrom - 1);
            nextProg = 0;
          }

          if (nextProg >= 1.0) {
            nextProg = 0;
            let candidateTo = newDir === 'DOWN' ? newTo + 1 : newTo - 1;

            // Check if candidateTo is within bounds and operational for selectedDate
            const candidateIsOp = candidateTo >= 0 && candidateTo < KOCHI_METRO_STATIONS.length && isStationOperational(candidateTo, selectedDate);

            if (candidateIsOp) {
              newFrom = newTo;
              newTo = candidateTo;
            } else {
              // TURNAROUND TRIGGERED: Next station is out of bounds or suspended on selectedDate!
              newDir = newDir === 'DOWN' ? 'UP' : 'DOWN';
              newFrom = newTo;

              const reversedCandidate = newDir === 'DOWN' ? newFrom + 1 : newFrom - 1;
              if (reversedCandidate >= 0 && reversedCandidate < KOCHI_METRO_STATIONS.length && isStationOperational(reversedCandidate, selectedDate)) {
                newTo = reversedCandidate;
              } else {
                newTo = newFrom;
              }
            }
          }

          // Random slight speed fluctuations
          const speedVar = (Math.random() - 0.5) * 2;
          const speedKmh = Math.min(65, Math.max(30, Math.round(pt.speedKmh + speedVar)));

          return {
            ...pt,
            fromStationIndex: newFrom,
            toStationIndex: newTo,
            progress: nextProg,
            direction: newDir,
            speedKmh,
          };
        });
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, simSpeed, selectedDate, dateStationsStatus, stationsStatus]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (viewMode !== 'GEOGRAPHIC' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Create dark tile map centered over Kochi
      const map = L.map(mapContainerRef.current, {
        center: [10.015, 76.320],
        zoom: 12,
        zoomControl: false,
      });

      // Dark theme map tiles (CartoDB Dark Matter)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapLinesLayerGroupRef.current = L.layerGroup().addTo(map);
      mapStationsLayerGroupRef.current = L.layerGroup().addTo(map);

      leafletMapRef.current = map;

      // Auto fit full metro line bounds
      setTimeout(() => {
        if (leafletMapRef.current) {
          const bounds = L.latLngBounds(
            KOCHI_METRO_STATIONS.map(st => [st.lat, st.lng] as [number, number])
          );
          bounds.extend([MUTTOM_DEPOT_COORD.lat, MUTTOM_DEPOT_COORD.lng]);
          leafletMapRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
        }
      }, 100);
    } else {
      setTimeout(() => {
        if (leafletMapRef.current) {
          leafletMapRef.current.invalidateSize();
        }
      }, 100);
    }
  }, [viewMode]);

  // Dynamic Drawing of Active Lines and Station Markers for selectedDate
  useEffect(() => {
    if (viewMode !== 'GEOGRAPHIC' || !leafletMapRef.current) return;
    const map = leafletMapRef.current;

    if (!mapLinesLayerGroupRef.current) {
      mapLinesLayerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      mapLinesLayerGroupRef.current.clearLayers();
    }

    if (!mapStationsLayerGroupRef.current) {
      mapStationsLayerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      mapStationsLayerGroupRef.current.clearLayers();
    }

    const linesGroup = mapLinesLayerGroupRef.current;
    const stationsGroup = mapStationsLayerGroupRef.current;

    // Draw Segment Polylines for selectedDate
    for (let i = 0; i < KOCHI_METRO_STATIONS.length - 1; i++) {
      const s1 = KOCHI_METRO_STATIONS[i];
      const s2 = KOCHI_METRO_STATIONS[i + 1];
      const isOp = isStationOperational(i, selectedDate) && isStationOperational(i + 1, selectedDate);

      const segmentCoords: [number, number][] = [[s1.lat, s1.lng], [s2.lat, s2.lng]];

      if (isOp) {
        // Outer glow line for active segment
        L.polyline(segmentCoords, {
          color: '#06b6d4',
          weight: 8,
          opacity: 0.35,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(linesGroup);

        // Inner solid neon cyan line for active segment
        const poly = L.polyline(segmentCoords, {
          color: '#22d3ee',
          weight: 4,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(linesGroup);

        poly.bindTooltip(`🟢 Active Revenue Segment: ${s1.name} ↔ ${s2.name} (${formatDateLabel(selectedDate)})`, { permanent: false, direction: 'center', className: 'dark-tooltip' });
      } else {
        // Outer rose glow for suspended segment
        L.polyline(segmentCoords, {
          color: '#e11d48',
          weight: 8,
          opacity: 0.25,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(linesGroup);

        // Inner dashed rose line for suspended segment
        const poly = L.polyline(segmentCoords, {
          color: '#f43f5e',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(linesGroup);

        poly.bindTooltip(`⚠️ SUSPENDED SEGMENT (${formatDateLabel(selectedDate)}): ${s1.name} ↔ ${s2.name}`, { permanent: false, direction: 'center', className: 'dark-tooltip' });
      }
    }

    // Draw Muttom Depot Connection Spur Line
    const depotCoords: [number, number][] = [
      [MUTTOM_DEPOT_COORD.lat, MUTTOM_DEPOT_COORD.lng],
      [KOCHI_METRO_STATIONS[4].lat, KOCHI_METRO_STATIONS[4].lng], // Station 5 Muttom
    ];

    L.polyline(depotCoords, {
      color: '#f59e0b',
      weight: 3,
      dashArray: '5, 8',
      opacity: 0.8,
    }).addTo(linesGroup);

    // Add Station Markers for selectedDate
    KOCHI_METRO_STATIONS.forEach((station, idx) => {
      const isOp = isStationOperational(idx, selectedDate);
      const isDepot = station.isDepotJunction;
      const isTerm = station.isTerminal;
      const stStatus = getStationStatus(station.id, selectedDate);

      const stationIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div style="
            width: ${isTerm ? '18px' : isDepot ? '16px' : '12px'};
            height: ${isTerm ? '18px' : isDepot ? '16px' : '12px'};
            background: ${!isOp ? '#f43f5e' : isTerm ? '#06b6d4' : isDepot ? '#f59e0b' : '#0f172a'};
            border: 2px solid ${!isOp ? '#fda4af' : isTerm ? '#ffffff' : isDepot ? '#fbbf24' : '#38bdf8'};
            border-radius: ${!isOp ? '2px' : '50%'};
            box-shadow: 0 0 10px ${!isOp ? '#f43f5e' : isTerm ? '#06b6d4' : isDepot ? '#f59e0b' : '#38bdf8'};
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 8px;
            font-weight: bold;
          ">${!isOp ? '✕' : ''}</div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([station.lat, station.lng], { icon: stationIcon }).addTo(stationsGroup);
      marker.bindTooltip(`
        <div style="font-family: monospace; font-size: 11px; font-weight: bold; padding: 2px 6px;">
          ${station.sequence}. ${station.name} (${station.code})
          ${!isOp ? ' <span style="color:#f43f5e">[SUSPENDED]</span>' : isTerm ? ' <span style="color:#06b6d4">[TERMINAL]</span>' : ''}
          ${isDepot ? ' <span style="color:#f59e0b">[DEPOT JUNCTION]</span>' : ''}
          ${!isOp && stStatus.reason ? `<div style="color:#fda4af; font-size:10px; font-weight:normal; margin-top:2px;">Reason: ${stStatus.reason}</div>` : ''}
        </div>
      `, { permanent: false, direction: 'top', className: 'dark-tooltip' });

      marker.on('click', () => {
        setSelectedStation(station);
      });
    });

  }, [viewMode, selectedDate, dateStationsStatus, stationsStatus]);

  // Update Train Markers on Leaflet Map
  useEffect(() => {
    if (viewMode !== 'GEOGRAPHIC' || !leafletMapRef.current) return;

    const map = leafletMapRef.current;

    activeTrains.forEach(at => {
      if (filterDirection !== 'ALL' && at.direction !== filterDirection) {
        if (markersRef.current[at.train.id]) {
          map.removeLayer(markersRef.current[at.train.id]);
          delete markersRef.current[at.train.id];
        }
        return;
      }

      const s1 = KOCHI_METRO_STATIONS[at.fromStationIndex];
      const s2 = KOCHI_METRO_STATIONS[at.toStationIndex];

      if (!s1 || !s2) return;

      // Linear interpolation between stations
      const curLat = s1.lat + (s2.lat - s1.lat) * at.progress;
      const curLng = s1.lng + (s2.lng - s1.lng) * at.progress;

      const isSelected = selectedTrainId === at.train.id;
      const isDown = at.direction === 'DOWN';

      const trainIcon = L.divIcon({
        className: 'custom-train-marker',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${isSelected ? '#38bdf8' : isDown ? '#0284c7' : '#0d9488'};
            color: #ffffff;
            border: 2px solid ${isSelected ? '#ffffff' : '#e0f2fe'};
            border-radius: 4px;
            padding: 2px 6px;
            font-family: monospace;
            font-size: 10px;
            font-weight: bold;
            box-shadow: 0 0 12px ${isDown ? 'rgba(2,132,199,0.8)' : 'rgba(13,148,136,0.8)'};
            cursor: pointer;
            white-space: nowrap;
            transform: scale(${isSelected ? 1.25 : 1});
            transition: all 0.3s ease;
          ">
            <span style="margin-right: 3px;">🚆</span>
            <span>${at.train.id}</span>
            <span style="margin-left: 4px; font-size: 8px; opacity: 0.8;">${isDown ? '↓' : '↑'}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      if (markersRef.current[at.train.id]) {
        markersRef.current[at.train.id].setLatLng([curLat, curLng]);
        markersRef.current[at.train.id].setIcon(trainIcon);
      } else {
        const marker = L.marker([curLat, curLng], { icon: trainIcon }).addTo(map);
        marker.on('click', () => {
          setSelectedTrainId(at.train.id);
          const fullTrain = fleet.find(f => f.id === at.train.id);
          if (fullTrain && onSelectTrain) {
            // Option to inspect train details
          }
        });
        markersRef.current[at.train.id] = marker;
      }
    });
  }, [activeTrains, viewMode, filterDirection, selectedTrainId]);

  // Highlight station search matching
  const queryClean = searchQuery.trim().toLowerCase();

  const filteredStations = KOCHI_METRO_STATIONS.filter(s =>
    !queryClean ||
    s.name.toLowerCase().includes(queryClean) ||
    s.code.toLowerCase().includes(queryClean) ||
    (s.malayalamName || '').toLowerCase().includes(queryClean)
  );

  const matchingStations = queryClean ? KOCHI_METRO_STATIONS.filter(s =>
    s.name.toLowerCase().includes(queryClean) ||
    s.code.toLowerCase().includes(queryClean) ||
    (s.malayalamName || '').toLowerCase().includes(queryClean) ||
    s.sequence.toString() === queryClean
  ) : [];

  const matchingTrains = queryClean ? activeTrains.filter(t =>
    t.train.id.toLowerCase().includes(queryClean) ||
    t.train.name.toLowerCase().includes(queryClean) ||
    t.driverName.toLowerCase().includes(queryClean)
  ) : [];

  const selectedTrainData = activeTrains.find(t => t.train.id === selectedTrainId);

  return (
    <div className="space-y-4">
      {/* Top Banner Control Panel */}
      <div className="cyber-card rounded-2xl p-5 relative overflow-hidden shadow-2xl border-white/10">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-black/60 border border-cyan-500/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)] mt-0.5">
              <KochiMetroLogo height={36} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  KOCHI METRO (AQUA LINE) • METRO AI TELEMETRY STREAM
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight mt-1 flex items-center space-x-3" style={{ fontFamily: "'Instrument Serif', serif" }}>
                <span>25-Station Active Line Tracker</span>
                <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-normal">
                  Aluva ↔ Thrippunithura
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl font-sans">
                Real-time spatial tracking of revenue trainsets, speed vectors, station dwell status & Muttom Depot induction lines.
              </p>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center space-x-4 bg-slate-950/80 p-2.5 rounded-sm border border-slate-800 text-xs font-mono">
            <div className="px-3 py-1 border-r border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">In Service</div>
              <div className="text-sm font-bold text-cyan-300 flex items-center space-x-1">
                <span>{inServiceTrains.length} Rakes</span>
              </div>
            </div>

            <div className="px-3 py-1 border-r border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Avg Speed</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                <span>48.5 km/h</span>
              </div>
            </div>

            <div className="px-3 py-1 border-r border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Headway</div>
              <div className="text-sm font-bold text-amber-400">6.5 min</div>
            </div>

            <div className="px-3 py-1">
              <div className="text-[10px] text-slate-500 uppercase">Track Voltage</div>
              <div className="text-sm font-bold text-indigo-300">750V DC</div>
            </div>
          </div>
        </div>

        {/* Calendar Date Selection & Operational Schedule Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/90 border border-cyan-500/30 p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 font-mono text-xs shadow-lg shadow-cyan-950/20">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-900 border border-cyan-500/40 px-3 py-1.5 rounded-md text-cyan-300">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Calendar Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-black text-cyan-300 font-mono font-bold text-xs border border-cyan-500/50 rounded px-2.5 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.2)]"
              />
            </div>

            {/* Quick Date Presets */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setSelectedDate(getTodayStr())}
                className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedDate === getTodayStr()
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getTomorrowStr())}
                className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedDate === getTomorrowStr()
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getDayAfterStr())}
                className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedDate === getDayAfterStr()
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                Day After
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(getWeekendStr())}
                className={`px-3 py-1.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedDate === getWeekendStr()
                    ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                Next Weekend
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded">
              <span className="text-slate-400">Timetable Active:</span>
              <span className="text-white font-bold">{formatDateLabel(selectedDate)}</span>
            </div>

            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded border font-bold ${
              KOCHI_METRO_STATIONS.filter((_, idx) => isStationOperational(idx, selectedDate)).length === 25
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            }`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              <span>
                {KOCHI_METRO_STATIONS.filter((_, idx) => isStationOperational(idx, selectedDate)).length} / 25 Stations Active
              </span>
            </div>
          </div>
        </div>

        {/* Control Bar: View Toggle, Search, Direction Filter & Simulation Speed */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* View Mode Toggle & Station Operations Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-sm border border-slate-800">
              <button
                onClick={() => setViewMode('GEOGRAPHIC')}
                className={`px-3 py-1.5 rounded-sm font-mono font-bold flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'GEOGRAPHIC'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Geographic Live Map</span>
              </button>

              <button
                onClick={() => setViewMode('SCHEMATIC')}
                className={`px-3 py-1.5 rounded-sm font-mono font-bold flex items-center space-x-1.5 transition-colors ${
                  viewMode === 'SCHEMATIC'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Schematic Diagram (2024 Reference)</span>
              </button>
            </div>

            <button
              onClick={() => setIsStationManagerOpen(true)}
              className="px-3 py-1.5 rounded-sm bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Configure Station Status for {selectedDate} ({KOCHI_METRO_STATIONS.filter((_, idx) => isStationOperational(idx, selectedDate)).length}/25 Open)</span>
            </button>
          </div>

          {/* Search Station or Train */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      if (matchingStations.length > 0) {
                        handleSelectStation(matchingStations[0]);
                        setIsSearchFocused(false);
                      } else if (matchingTrains.length > 0) {
                        handleSelectTrain(matchingTrains[0].train.id);
                        setIsSearchFocused(false);
                      }
                    }
                  }}
                  placeholder="Find station or train..."
                  className="pl-8 pr-7 py-1.5 bg-slate-950 border border-slate-800 rounded-sm text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 w-52 shadow-inner"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-2.5" />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedStation(null);
                      setSelectedTrainId(null);
                    }}
                    className="absolute right-2 text-slate-500 hover:text-white cursor-pointer"
                    title="Clear Search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results Auto-Dropdown Popup */}
              {isSearchFocused && searchQuery.trim() && (matchingStations.length > 0 || matchingTrains.length > 0) && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-slate-950/95 border border-cyan-500/50 rounded-lg shadow-2xl z-50 overflow-hidden font-mono text-xs max-h-64 overflow-y-auto backdrop-blur-md">
                  {matchingStations.length > 0 && (
                    <div>
                      <div className="px-3 py-1 bg-cyan-950/80 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border-b border-cyan-500/20">
                        Matching Stations ({matchingStations.length})
                      </div>
                      {matchingStations.map(st => (
                        <button
                          key={st.id}
                          onClick={() => {
                            handleSelectStation(st);
                            setSearchQuery(st.name);
                            setIsSearchFocused(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-cyan-500/20 text-slate-200 hover:text-white flex items-center justify-between border-b border-slate-900 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                            <span className="font-bold truncate">#{st.sequence.toString().padStart(2, '0')} {st.name}</span>
                          </div>
                          <span className="text-[10px] text-cyan-300/80 font-normal ml-2 flex-shrink-0">{st.code}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {matchingTrains.length > 0 && (
                    <div>
                      <div className="px-3 py-1 bg-emerald-950/80 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border-b border-emerald-500/20">
                        Matching Active Trains ({matchingTrains.length})
                      </div>
                      {matchingTrains.map(at => (
                        <button
                          key={at.train.id}
                          onClick={() => {
                            handleSelectTrain(at.train.id);
                            setSearchQuery(at.train.id);
                            setIsSearchFocused(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-emerald-500/20 text-slate-200 hover:text-white flex items-center justify-between border-b border-slate-900 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-xs">🚆</span>
                            <span className="font-bold truncate">{at.train.id} ({at.train.name})</span>
                          </div>
                          <span className="text-[10px] text-emerald-300 font-normal ml-2 flex-shrink-0">{at.speedKmh} km/h</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Direction Filter */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-sm border border-slate-800 font-mono text-[11px]">
              <button
                onClick={() => setFilterDirection('ALL')}
                className={`px-2 py-0.5 rounded-sm ${filterDirection === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDirection('DOWN')}
                className={`px-2 py-0.5 rounded-sm flex items-center space-x-1 ${filterDirection === 'DOWN' ? 'bg-sky-950 text-sky-300 border border-sky-800 font-bold' : 'text-slate-400'}`}
              >
                <ArrowDownRight className="w-3 h-3 text-sky-400" />
                <span>Aluva→Thrippunithura</span>
              </button>
              <button
                onClick={() => setFilterDirection('UP')}
                className={`px-2 py-0.5 rounded-sm flex items-center space-x-1 ${filterDirection === 'UP' ? 'bg-teal-950 text-teal-300 border border-teal-800 font-bold' : 'text-slate-400'}`}
              >
                <ArrowUpRight className="w-3 h-3 text-teal-400" />
                <span>Thrippunithura→Aluva</span>
              </button>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="text-slate-500">Live Telemetry Speed:</span>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded-sm bg-slate-950 border border-slate-800 text-slate-300 hover:text-white"
              title={isPaused ? "Resume Live Sync" : "Pause Live Sync"}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            {[1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setSimSpeed(s)}
                className={`px-2 py-0.5 rounded-sm border ${
                  simSpeed === s ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Map Container Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

        {/* Map Canvas / Diagram View */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-sm relative min-h-[580px] overflow-hidden flex flex-col">
          
          {viewMode === 'GEOGRAPHIC' ? (
            /* Geographic Leaflet Map */
            <div className="relative w-full h-[580px] z-0">
              <div ref={mapContainerRef} className="w-full h-full bg-slate-950" />

              {/* Floating Map Navigation & Zoom Controls Overlay */}
              <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2 font-mono text-xs">
                <div className="bg-slate-950/90 border border-cyan-500/40 backdrop-blur-md rounded-lg p-1.5 shadow-2xl flex flex-col space-y-1">
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                    title="Zoom In Map"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                    title="Zoom Out Map"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="h-px bg-slate-800 my-0.5" />
                  <button
                    onClick={handleFitFullMap}
                    className="p-2 rounded bg-cyan-950/80 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    title="Fit Full Metro Line (Show All 25 Stations)"
                  >
                    <Maximize2 className="w-4 h-4 text-cyan-300" />
                  </button>
                </div>

                <button
                  onClick={handleFitFullMap}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/95 border border-cyan-400/60 hover:border-cyan-300 text-cyan-300 hover:text-white font-bold text-[11px] shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur-md"
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Show Full Map</span>
                </button>

                <button
                  onClick={handleFocusDepot}
                  className="px-3 py-1.5 rounded-lg bg-slate-950/90 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-medium text-[10px] shadow-lg flex items-center space-x-1.5 transition-all cursor-pointer backdrop-blur-md"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Muttom OCC Depot</span>
                </button>
              </div>

              {/* Overlay Map Legend */}
              <div className="absolute bottom-4 left-4 z-10 bg-slate-950/90 border border-slate-800 backdrop-blur-md p-3 rounded-sm font-mono text-[11px] text-slate-300 space-y-1.5 shadow-xl">
                <div className="font-bold text-white uppercase text-[10px] tracking-wider mb-1 flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Kochi Metro Map Legend</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-1 bg-cyan-400 rounded-full" />
                  <span>Aqua Revenue Line (Aluva - Thrippunithura)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-0.5 border-t border-dashed border-amber-400" />
                  <span>Muttom Depot Shunting Spur</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-sky-300" />
                  <span>Aluva-Bound / Down-Line Rake</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-600 border border-teal-300" />
                  <span>Thrippunithura-Bound / Up-Line Rake</span>
                </div>
              </div>
            </div>
          ) : (
            /* Schematic Diagram View (Reference Graphic Styled) */
            <div className="p-6 bg-slate-950 text-slate-200 overflow-y-auto max-h-[580px] font-mono relative">
              <div className="max-w-2xl mx-auto space-y-4">
                
                {/* Schematic Title & Zoom Bar */}
                <div className="sticky top-0 z-20 bg-slate-950/95 border-b border-cyan-500/30 pb-3 flex items-center justify-between backdrop-blur-md">
                  <div>
                    <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest">Kochi Metro System Map • 2024 Line Alignment</div>
                    <div className="text-lg font-bold text-white">Aluva ↔ Thrippunithura Line Diagram</div>
                  </div>
                  
                  {/* Schematic Zoom Toolbar Controls */}
                  <div className="flex items-center space-x-1 bg-slate-900 border border-cyan-500/40 rounded-lg p-1">
                    <button
                      onClick={handleZoomIn}
                      className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-300 hover:text-white cursor-pointer"
                      title="Zoom In Schematic"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleZoomOut}
                      className="p-1.5 rounded hover:bg-cyan-500/20 text-cyan-300 hover:text-white cursor-pointer"
                      title="Zoom Out Schematic"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] text-cyan-300 font-mono px-1 font-bold">{Math.round(schematicZoom * 100)}%</span>
                    <button
                      onClick={handleFitFullMap}
                      className="px-2 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold hover:bg-cyan-900 cursor-pointer flex items-center space-x-1"
                      title="Reset Schematic Zoom"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Vertical Line Transit Schematic Scaled by schematicZoom */}
                <div
                  style={{
                    transform: `scale(${schematicZoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="relative pl-8 my-6 space-y-3 border-l-4 border-cyan-400 ml-4"
                >
                  
                  {KOCHI_METRO_STATIONS.map((station, idx) => {
                    const isSelected = selectedStation?.id === station.id;
                    const trainsAtStation = activeTrains.filter(
                      t => t.fromStationIndex === idx || t.toStationIndex === idx
                    );

                    return (
                      <div
                        key={station.id}
                        onClick={() => setSelectedStation(station)}
                        className={`relative group cursor-pointer p-2.5 rounded-sm transition-all border ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 shadow-md shadow-cyan-950'
                            : 'bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900'
                        }`}
                      >
                        {/* Node Dot */}
                        <div
                          className={`absolute -left-[43px] top-4 w-4 h-4 rounded-full border-2 transition-all ${
                            station.isTerminal
                              ? 'bg-cyan-400 border-white shadow-lg shadow-cyan-400/80 scale-110'
                              : station.isDepotJunction
                              ? 'bg-amber-400 border-amber-200 shadow-lg shadow-amber-400/80 scale-110'
                              : 'bg-slate-950 border-cyan-400 group-hover:scale-125'
                          }`}
                        />

                        {/* Station Item Info */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-bold text-slate-500">#{station.sequence.toString().padStart(2, '0')}</span>
                              <span className="text-sm font-bold text-white group-hover:text-cyan-300">{station.name}</span>
                              <span className="text-xs text-slate-400 font-normal">({station.code})</span>
                              {station.malayalamName && (
                                <span className="text-xs text-cyan-400/80 font-normal ml-1">{station.malayalamName}</span>
                              )}
                            </div>

                            {station.interchangeInfo && (
                              <div className="text-[11px] text-amber-300/90 mt-1 flex items-center space-x-1">
                                <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                <span>{station.interchangeInfo}</span>
                              </div>
                            )}

                            {/* Muttom Depot Spur Indication */}
                            {station.isDepotJunction && (
                              <div className="mt-2 p-2 bg-amber-950/40 border border-amber-500/30 rounded-sm text-[11px] text-amber-200">
                                <strong>Muttom Operations Center & Stabling Depot Spur:</strong> Direct shunting link for 25 Metropolis rakes.
                              </div>
                            )}
                          </div>

                          {/* Active Train Badges At / Approaching Station */}
                          {trainsAtStation.length > 0 && (
                            <div className="flex flex-col items-end space-y-1">
                              {trainsAtStation.map(at => (
                                <span
                                  key={at.train.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrainId(at.train.id);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center space-x-1 cursor-pointer hover:scale-105 ${
                                    at.direction === 'DOWN'
                                      ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                                      : 'bg-teal-950 text-teal-300 border-teal-500/50'
                                  }`}
                                >
                                  <span>🚆 {at.train.id}</span>
                                  <span>({at.speedKmh} km/h)</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Inspector Panel (Station or Selected Train) */}
        <div className="space-y-4">

          {/* Selected Train Inspector Card */}
          {selectedTrainData ? (
            <div className="bg-slate-900 border border-cyan-500/40 rounded-sm p-4 space-y-3 font-mono text-xs shadow-lg shadow-cyan-950/20">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🚆</span>
                  <div>
                    <div className="font-bold text-white text-sm">{selectedTrainData.train.name}</div>
                    <div className="text-[10px] text-cyan-400">Rake #{selectedTrainData.train.rakeNumber} • Active Telemetry</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrainId(null)}
                  className="text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500">Live Speed</div>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">{selectedTrainData.speedKmh} km/h</div>
                </div>

                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500">Passenger Load</div>
                  <div className="font-bold text-cyan-300 text-sm mt-0.5">{selectedTrainData.occupancyPercent}% Occupancy</div>
                </div>

                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500">Direction</div>
                  <div className="font-bold text-white mt-0.5">
                    {selectedTrainData.direction === 'DOWN' ? 'Aluva → Thrippunithura' : 'Thrippunithura → Aluva'}
                  </div>
                </div>

                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <div className="text-slate-500">Schedule Status</div>
                  <div className="font-bold text-emerald-400 mt-0.5">
                    {selectedTrainData.delayMinutes === 0 ? 'On Time (±0s)' : `+${selectedTrainData.delayMinutes}m delay`}
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-[11px] space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Current Segment:</span>
                  <span className="text-white font-bold">
                    {KOCHI_METRO_STATIONS[selectedTrainData.fromStationIndex]?.code} → {KOCHI_METRO_STATIONS[selectedTrainData.toStationIndex]?.code}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Duty Driver:</span>
                  <span className="text-cyan-300">{selectedTrainData.driverName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cumulative Wear:</span>
                  <span className="text-slate-200">{selectedTrainData.train.mileageTotal.toLocaleString()} km</span>
                </div>
              </div>

              {onSelectTrain && (
                <button
                  onClick={() => onSelectTrain(selectedTrainData.train)}
                  className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold rounded-sm text-center transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Inspect Full Work Orders & Certs</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 font-mono text-xs text-slate-400 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-white text-xs uppercase tracking-wider">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Rake Telemetry Inspector</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Click any active train icon on the map or schematic list to view live speed, duty operator, voltage draw and track occupancy.
              </p>
            </div>
          )}

          {/* Selected Station Inspector Card */}
          {selectedStation && (
            <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="font-bold text-white text-sm">{selectedStation.name} Station</div>
                  <div className="text-[10px] text-cyan-400">{selectedStation.code} • Stop #{selectedStation.sequence} of 25</div>
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {selectedStation.interchangeInfo && (
                <div className="p-2 bg-amber-950/30 border border-amber-500/30 text-amber-200 rounded text-[11px]">
                  <strong>Interchange / Transit Hub:</strong>
                  <div className="mt-0.5">{selectedStation.interchangeInfo}</div>
                </div>
              )}

              {selectedStation.popularLandmarks && (
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Key Nearby Destinations:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedStation.popularLandmarks.map((lm, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300">
                        {lm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded space-y-2">
                <div className="font-bold text-white text-[11px] uppercase tracking-wider border-b border-slate-800 pb-1">
                  Upcoming Platform Arrivals
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center text-sky-300">
                    <span>Platform 1 (Thrippunithura)</span>
                    <span className="font-bold">ETA 2 mins</span>
                  </div>
                  <div className="flex justify-between items-center text-teal-300">
                    <span>Platform 2 (Aluva)</span>
                    <span className="font-bold">ETA 4 mins</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Line Overview List */}
          <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 font-mono text-xs space-y-3">
            <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Station Quick Selector</span>
              <span className="text-[10px] text-cyan-400">{filteredStations.length} Stations</span>
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {filteredStations.map(st => (
                <button
                  key={st.id}
                  onClick={() => handleSelectStation(st)}
                  className={`w-full text-left p-1.5 rounded text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                    selectedStation?.id === st.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'hover:bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate">#{st.sequence.toString().padStart(2, '0')} {st.name}</span>
                  <span className="text-[9px] text-slate-500 font-normal">{st.code}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Station Operational Readiness Modal for Selected Date */}
      {isStationManagerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass bg-slate-950/95 border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative space-y-4 font-sans">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center space-x-2 text-cyan-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-xl font-medium text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
                    KMRL Station Operational Readiness Manager
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1 font-sans">
                  Select which stations will be operational for <strong className="text-cyan-300">{formatDateLabel(selectedDate)}</strong>. Suspended stations will be automatically bypassed by OCC routing algorithms and revenue trainsets.
                </p>
              </div>
              <button
                onClick={() => setIsStationManagerOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date Picker inside Modal */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs font-mono">
              <div className="flex items-center space-x-2 text-slate-300">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Editing Operational Status for:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-black text-cyan-300 border border-cyan-500/40 rounded px-2.5 py-1 font-bold focus:outline-none"
                />
              </div>

              <div className="text-slate-400">
                <span className="text-emerald-400 font-bold">
                  {KOCHI_METRO_STATIONS.filter((_, idx) => isStationOperational(idx, selectedDate)).length}
                </span> / 25 Stations Active
              </div>
            </div>

            {/* Station Status Grid */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {KOCHI_METRO_STATIONS.map((station) => {
                  const statusObj = getStationStatus(station.id, selectedDate);
                  const isOpen = statusObj ? statusObj.isOperational !== false : true;
                  const currentReason = statusObj?.reason || '';

                  return (
                    <div
                      key={station.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                        isOpen
                          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          : 'bg-rose-950/20 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'}`} />
                          <div>
                            <span className="text-xs font-mono font-bold text-white uppercase">{station.sequence.toString().padStart(2, '0')}. {station.name}</span>
                            <span className="text-[10px] text-slate-400 ml-2 font-mono">({station.code})</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleToggleStationForDate(
                              station.id,
                              !isOpen,
                              !isOpen ? '' : currentReason || 'Track Maintenance & Overhaul'
                            );
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer transition-all ${
                            isOpen
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/50 hover:bg-rose-500/30'
                          }`}
                        >
                          {isOpen ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-400" />
                              <span>OPERATIONAL</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-rose-400" />
                              <span>SUSPENDED</span>
                            </>
                          )}
                        </button>
                      </div>

                      {!isOpen && (
                        <div className="pt-1">
                          <label className="block text-[10px] font-mono text-rose-300 mb-1 font-semibold uppercase">Suspension Reason / Note for OCC:</label>
                          <input
                            type="text"
                            placeholder="e.g. Platform gate maintenance, flooding alert, or signal upgrade"
                            value={currentReason}
                            onChange={(e) => {
                              handleToggleStationForDate(station.id, false, e.target.value);
                            }}
                            className="w-full bg-black/60 border border-rose-500/30 rounded-lg px-2.5 py-1 text-xs text-rose-200 placeholder-rose-400/50 focus:outline-none focus:border-rose-400 font-sans"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-xs font-mono text-slate-400">
                {KOCHI_METRO_STATIONS.filter((_, idx) => !isStationOperational(idx, selectedDate)).length} Stations Suspended for {formatDateLabel(selectedDate)}
              </span>
              <button
                onClick={() => setIsStationManagerOpen(false)}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                Save Schedule Configuration
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
