/**
 * [INPUT]: 依赖 @/lib/agent/site 的 SITE / SOCIAL / CONTACT 事实
 * [OUTPUT]: 对外提供 buildJsonLd() —— 站点级 schema.org @graph（Organization + Person + WebSite）
 * [POS]: lib/agent 的结构化数据层；被根布局注入首页与全站，与 writing/[slug] 的文章级 BlogPosting 互补
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { CONTACT, SITE, SOCIAL } from '@/lib/agent/site'

export function buildJsonLd() {
  const organizationId = `${SITE.url}/#organization`
  const personId = `${SITE.url}/#person`

  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE.url}/icon`
    },
    // 公开联系渠道：邮箱 + GitHub Issues（邮箱由站点所有者确认公开）
    email: CONTACT.email,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: CONTACT.contactType,
      email: CONTACT.email,
      url: CONTACT.url,
      availableLanguage: ['en', 'zh']
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: SITE.address.addressLocality,
      addressCountry: SITE.address.addressCountry
    },
    sameAs: [SOCIAL.github, SOCIAL.x]
  }

  const person = {
    '@type': 'Person',
    '@id': personId,
    name: SITE.author,
    alternateName: ['Zen', '叶振幸'],
    url: SITE.url,
    description: SITE.description,
    jobTitle: 'AI Product Manager',
    knowsAbout: ['AI agents', 'mathematical modeling', 'deep learning', 'open-source software'],
    sameAs: [SOCIAL.github, SOCIAL.x],
    affiliation: { '@id': organizationId }
  }

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.language,
    publisher: { '@id': organizationId },
    author: { '@id': personId }
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [organization, person, website]
  }
}
