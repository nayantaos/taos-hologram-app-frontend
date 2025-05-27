
export type SlideType = "3d" | "video";

export interface SlideConfig {
  file: string;
  rotation_time: number;
  type: SlideType;
  zoom: any;
  wall: any;
  Dlight: any;
  shadow_opacity: number;
  qr_links: qrData[];
}

export interface qrData {
  label: string;
  link: string;
  position: string;
  qr: string;
}

export interface SlidePlayerConfig {
  files: SlideConfig[];
  company_logo: string;
}
