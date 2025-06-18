import { injectable } from 'tsyringe';
import { IDateProvider } from '../../domain/providers/IDateProvider.ts';

@injectable()
export class DateProvider implements IDateProvider {
  now(): Date {
    return new Date();
  }

  parse(dateString: string): Date {
    return new Date(dateString);
  }
}