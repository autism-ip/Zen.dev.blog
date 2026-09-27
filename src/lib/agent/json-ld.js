/**
 * [INPUT]: Public site identity and contact information
 * [OUTPUT]: Person and WebSite entities with stable shared identifiers
 * [POS]: Personal-site JSON-LD, linked by ProfilePage and article markup
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { CONTACT, SITE, SOCIAL } from '@/lib/agent/site'

export function buildJsonLd() {
  const personId = `${SITE.url}/#person`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: SITE.author,
        alternateName: ['Zen', '叶振幸', 'zenhungyep'],
        url: `${SITE.url}/about`,
        description: SITE.description,
        email: CONTACT.email,
        image: `${SITE.url}/assets/dp.jpg`,
        knowsAbout: ['AI agents', 'mathematical modeling', 'deep learning', 'open-source software'],
        sameAs: [SOCIAL.github, SOCIAL.x]
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        alternateName: ['zenhungyep', 'Zen'],
        description: SITE.description,
        inLanguage: SITE.language,
        publisher: { '@id': personId },
        author: { '@id': personId }
      }
    ]
  }
}
