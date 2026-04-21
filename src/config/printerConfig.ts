export interface LabelDimension {
  width: number;
  height: number;
}

export const PRINTER_IP: string = "192.168.1.100";
export const PRINTER_PORT: number = 9100;
export const PRINTER_DPMM: string = "8dpmm";

export const LABEL_DIMENSIONS: Record<string, LabelDimension> = {
  partLabel: { width: 2, height: 1 },
  shippingLabel: { width: 4, height: 6 },
};
