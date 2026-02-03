import { PrismaDbClient } from '@shared/types/prisma.types'

type RepositoryConstructor<TRepository> = new (client: PrismaDbClient) => TRepository

type RepositoryWithConstructor<TRepository> = TRepository & {
  constructor: RepositoryConstructor<TRepository>
}

/**
 * Creates a repository instance that is bound to a specific Prisma client (transaction or root).
 */
export function cloneRepository<TRepository extends object>(
  repository: TRepository,
  client: PrismaDbClient
): TRepository {
  const repositoryWithConstructor = repository as unknown as RepositoryWithConstructor<TRepository>
  const RepositoryClass = repositoryWithConstructor.constructor
  return new RepositoryClass(client)
}
