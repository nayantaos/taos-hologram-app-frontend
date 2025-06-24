
export type SlideType = "3d" | "Video";

export interface SlideConfig {
  file: string;
  rotation_time: number;
  type: SlideType;
  zoom: any;
  wall: any;
  Dlight: any;
  shadow_opacity: number;
  qr_links: qrData[];
  product_name: string;
  price: number;
  Product_description: string;
  audio_file: string;
  camera_kit_token?: string;
  camera_kit_lens_group?: string;
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
