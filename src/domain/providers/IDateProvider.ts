export interface IDateProvider {
  now(): Date;
  parse(dateString: string): Date;
}