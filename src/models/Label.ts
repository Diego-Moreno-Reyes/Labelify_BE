export interface ILabel {
  id?: number;
  printer_id: number;
  part_number_dpo: string;
  part_number: string;
  vpps: string;
  location_code: string;
  duns: string;
  printing_limit: number;
}

export class Label {
  static fromRow(row: any): ILabel {
    return {
      id: row.id,
      printer_id: row.printer_id,
      part_number_dpo: row.part_number_dpo,
      part_number: row.part_number,
      vpps: row.vpps,
      location_code: row.location_code,
      duns: row.duns,
      printing_limit: row.printing_limit
    };
  }
}



