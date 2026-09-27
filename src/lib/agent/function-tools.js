/**
 * [INPUT]: Canonical public operations from buildOpenApi
 * [OUTPUT]: OpenAI Responses API function tools with explicit JSON Schema arguments
 * [POS]: Discovery adapter only; callers map query/body arguments to HTTP and retain endpoint access restrictions
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { buildOpenApi } from '@/lib/agent/openapi'

const objectSchema = () => ({ type: 'object', properties: {}, required: [], additionalProperties: false })

export function buildFunctionTools() {
  return Object.entries(buildOpenApi().paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, operation]) => {
      const parameters = objectSchema()
      for (const parameter of operation.parameters) {
        const group = parameter.in
        parameters.properties[group] ??= objectSchema()
        parameters.properties[group].properties[parameter.name] = {
          ...structuredClone(parameter.schema),
          ...(parameter.description ? { description: parameter.description } : {})
        }
        if (parameter.required) {
          parameters.properties[group].required.push(parameter.name)
          if (!parameters.required.includes(group)) parameters.required.push(group)
        }
      }
      const body = operation.requestBody?.content?.['application/json']?.schema
      if (body) {
        parameters.properties.body = structuredClone(body)
        if (operation.requestBody.required) parameters.required.push('body')
      }
      return {
        type: 'function',
        name: operation.operationId,
        description: `${method.toUpperCase()} ${path}. ${operation.description}`,
        parameters,
        // Strict mode would make currently optional query fields required.
        strict: false
      }
    })
  )
}
