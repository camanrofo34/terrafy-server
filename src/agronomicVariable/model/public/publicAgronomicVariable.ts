export interface PublicAgronomicVariable {
    variableId: number;
    name: string;
    measurementUnit: string;
    description?: string;
    creationDate: Date;
    updateDate: Date;
}