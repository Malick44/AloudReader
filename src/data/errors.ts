export class DataAccessError extends Error {
  domain: string;

  constructor(domain: string, message: string) {
    super(message);
    this.name = 'DataAccessError';
    this.domain = domain;
  }
}

export function assertNoSupabaseError(domain: string, error: { message: string } | null): void {
  if (error) {
    throw new DataAccessError(domain, error.message);
  }
}
