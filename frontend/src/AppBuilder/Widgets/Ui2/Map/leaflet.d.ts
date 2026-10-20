// leaflet ships no types and @types/leaflet is not installed: the part of its API the Map uses.
declare module 'leaflet' {
  interface LatLngLiteral {
    lat: number;
    lng: number;
  }
  type LatLngExpression = LatLngLiteral | [number, number];

  interface Point {
    x: number;
    y: number;
  }

  interface LatLngBounds {
    pad(ratio: number): LatLngBounds;
    getWest(): number;
    getSouth(): number;
    getEast(): number;
    getNorth(): number;
    getNorthEast(): LatLngLiteral;
    getSouthWest(): LatLngLiteral;
    contains(at: LatLngExpression): boolean;
  }

  interface Handler {
    enable(): void;
    disable(): void;
  }

  interface LeafletEvent {
    type: string;
  }
  interface LeafletMouseEvent extends LeafletEvent {
    latlng: LatLngLiteral;
  }
  interface PopupEvent extends LeafletEvent {
    popup: Popup;
  }
  interface DragEndEvent extends LeafletEvent {
    target: Marker;
  }

  interface Evented {
    on(type: 'click', fn: (e: LeafletMouseEvent) => void): this;
    on(type: 'popupclose', fn: (e: PopupEvent) => void): this;
    on(type: 'dragend', fn: (e: DragEndEvent) => void): this;
    on(type: string, fn: (e: LeafletEvent) => void, context?: unknown): this;
    off(type?: string, fn?: (e: LeafletEvent) => void, context?: unknown): this;
  }

  interface Layer extends Evented {
    addTo(map: LeafletMap | LayerGroup): this;
    getElement?(): HTMLElement | undefined;
  }

  interface TooltipOptions {
    permanent?: boolean;
    direction?: string;
    className?: string;
    sticky?: boolean;
  }

  interface Path extends Layer {
    bindTooltip(content: string, options?: TooltipOptions): this;
  }

  interface PathOptions {
    className?: string;
    weight?: number;
    interactive?: boolean;
    bubblingMouseEvents?: boolean;
    lineCap?: string;
    lineJoin?: string;
    radius?: number;
  }

  interface Icon {
    options: object;
  }

  interface DivIconOptions {
    className?: string;
    html?: string | HTMLElement;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  }

  interface MarkerOptions {
    icon?: Icon;
    title?: string;
    keyboard?: boolean;
    interactive?: boolean;
    riseOnHover?: boolean;
    zIndexOffset?: number;
    draggable?: boolean;
  }

  interface Marker extends Layer {
    setLatLng(at: LatLngExpression): this;
    getLatLng(): LatLngLiteral;
    dragging?: Handler;
  }

  interface PopupOptions {
    className?: string;
    offset?: [number, number];
    minWidth?: number;
    maxWidth?: number;
    closeButton?: boolean;
    autoPan?: boolean;
    autoPanPadding?: [number, number];
  }

  interface Popup extends Layer {
    options: PopupOptions;
    setLatLng(at: LatLngExpression): this;
    setContent(content: HTMLElement | string): this;
    openOn(map: LeafletMap): this;
  }

  interface LayerGroup extends Layer {
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    clearLayers(): this;
  }

  interface TileLayerOptions {
    attribution?: string;
    subdomains?: string;
    maxZoom?: number;
    crossOrigin?: boolean;
    className?: string;
  }

  interface Control {
    addTo(map: LeafletMap): this;
  }

  interface MapOptions {
    center?: LatLngExpression;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    zoomSnap?: number;
    zoomControl?: boolean;
    worldCopyJump?: boolean;
    fadeAnimation?: boolean;
    scrollWheelZoom?: boolean;
  }

  interface LeafletMap extends Evented {
    getSize(): Point;
    getBounds(): LatLngBounds;
    getCenter(): LatLngLiteral;
    getZoom(): number;
    setView(center: LatLngExpression, zoom: number, options?: { animate?: boolean }): this;
    setZoom(zoom: number, options?: { animate?: boolean }): this;
    setZoomAround(point: Point, zoom: number): this;
    invalidateSize(options?: { pan?: boolean }): this;
    closePopup(popup?: Popup): this;
    hasLayer(layer: Layer): boolean;
    removeLayer(layer: Layer): this;
    remove(): this;
    mouseEventToContainerPoint(e: MouseEvent): Point;
    containerPointToLayerPoint(point: [number, number]): Point;
    latLngToContainerPoint(at: LatLngExpression): Point;
    getPanes(): { overlayPane: HTMLElement };
    attributionControl: { setPrefix(prefix: string): void };
    dragging: Handler;
    touchZoom: Handler;
    doubleClickZoom: Handler;
    boxZoom: Handler;
    keyboard: Handler;
    scrollWheelZoom: Handler;
  }

  /** Leaflet's class factory: a Layer subclass with the given methods; `S` types the fields they set on `this`. */
  interface LayerClass {
    extend<T extends object, S extends object>(
      props: T & ThisType<T & S & Layer>
    ): new (...args: unknown[]) => T & S & Layer;
  }

  interface Leaflet {
    map(host: HTMLElement, options?: MapOptions): LeafletMap;
    control: { zoom(options: { position?: string; zoomInTitle?: string; zoomOutTitle?: string }): Control };
    layerGroup(): LayerGroup;
    divIcon(options: DivIconOptions): Icon;
    marker(at: LatLngExpression, options?: MarkerOptions): Marker;
    popup(options?: PopupOptions): Popup;
    tileLayer(url: string, options?: TileLayerOptions): Layer;
    polyline(path: LatLngExpression[], options?: PathOptions): Path;
    polygon(path: LatLngExpression[], options?: PathOptions): Path;
    circle(center: LatLngExpression, options?: PathOptions): Path;
    Browser: { svg: boolean };
    Layer: LayerClass;
    DomUtil: {
      create<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K];
      setPosition(el: HTMLElement, point: Point): void;
    };
  }

  const L: Leaflet;
  export default L;
  export type {
    DragEndEvent,
    Icon,
    Layer,
    LayerGroup,
    LatLngBounds,
    LatLngExpression,
    LatLngLiteral,
    LeafletMap,
    LeafletMouseEvent,
    Marker,
    Path,
    Point,
    Popup,
    PopupEvent,
  };
}
