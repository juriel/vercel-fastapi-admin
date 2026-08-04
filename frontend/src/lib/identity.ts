function nameFromIdentity(identity: string): string {
  return identity.split('@')[0].replace(/[._-]+/g, ' ').trim()
}

export function initialsFromIdentity(identity: string): string {
  const parts = nameFromIdentity(identity).split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

export function displayNameFromIdentity(identity: string): string {
  const name = nameFromIdentity(identity)
  if (!name) return 'Usuario'
  return name
    .split(' ')
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(' ')
}
