export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T = any> = () => T;

export enum LifetimeScope {
  SINGLETON = 'singleton',
  TRANSIENT = 'transient'
}

export interface ServiceRegistration<T = any> {
  factory: Factory<T>;
  lifetime: LifetimeScope;
  instance?: T;
}

export class DIContainer {
  private readonly services = new Map<string, ServiceRegistration>();
  private readonly singletonInstances = new Map<string, any>();

  register<T>(
    key: string, 
    factory: Factory<T>, 
    lifetime: LifetimeScope = LifetimeScope.TRANSIENT
  ): void {
    this.services.set(key, { factory, lifetime });
  }

  registerSingleton<T>(key: string, factory: Factory<T>): void {
    this.register(key, factory, LifetimeScope.SINGLETON);
  }

  registerTransient<T>(key: string, factory: Factory<T>): void {
    this.register(key, factory, LifetimeScope.TRANSIENT);
  }

  resolve<T>(key: string): T {
    const registration = this.services.get(key);
    
    if (!registration) {
      throw new Error(`Service '${key}' not registered`);
    }

    if (registration.lifetime === LifetimeScope.SINGLETON) {
      if (!this.singletonInstances.has(key)) {
        const instance = registration.factory();
        this.singletonInstances.set(key, instance);
        return instance as T;
      }
      return this.singletonInstances.get(key) as T;
    }

    return registration.factory() as T;
  }

  isRegistered(key: string): boolean {
    return this.services.has(key);
  }

  clear(): void {
    this.services.clear();
    this.singletonInstances.clear();
  }
}

export const container = new DIContainer();