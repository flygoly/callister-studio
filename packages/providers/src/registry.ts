import type { ProviderAdapter } from '@callister/core'

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderAdapter>()

  register(provider: ProviderAdapter): void {
    this.providers.set(provider.id, provider)
  }

  get(id: string): ProviderAdapter | undefined {
    return this.providers.get(id)
  }

  list(): ProviderAdapter[] {
    return [...this.providers.values()]
  }
}

export function createProviderRegistry(): ProviderRegistry {
  return new ProviderRegistry()
}
