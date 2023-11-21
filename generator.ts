import {
    WsAny, WsContent, WsCustom,
    WsEndpoint,
    WsEnum,
    WsNode, WsPrimitive, WsReference,
    WsRefined,
    WsType
} from "@flock/wirespec";

import {randexp} from 'randexp'

export const generator = (ast:WsNode[]) => {

    const findNodeByName = (name: String): WsNode | undefined => {
        return ast.find(node => {
            if (node instanceof WsType) return node.name === name
            if (node instanceof WsEnum) return node.name === name
            if (node instanceof WsEndpoint) return node.name === name
            if (node instanceof WsRefined) return node.name === name
            throw new Error(`Cannot find node: ${name}`)
        })
    }

    const generateRandomNode = (node?: WsNode): (Record<string, string> | string) | undefined => {
        if (node instanceof WsType) return node?.shape.value.reduce((acc, cur) => ({
            ...acc,
            [cur.identifier.value]: generateRandomReference(cur.reference)
        }), {})
        if (node instanceof WsEnum) {
            const i = Math.floor(Math.random() * (node?.entries?.length ?? 0));
            return node?.entries?.[i]
        }
        if (node instanceof WsRefined) randexp(node.validator)
        if (node instanceof WsEndpoint) throw new Error(`Cannot generate random WsEndpoint`)
        throw new Error(`Cannot generate random node`)
    }

    const generateRandomReference = (reference: WsReference): (Record<string, string> | string | undefined)[] | (Record<string, string> | string | undefined) => {
        switch (reference.constructor) {
            case WsAny:
                return randexp(".*")
            case WsPrimitive:
                return randexp(".*")
            case WsCustom: {
                const name = (reference as WsCustom).value
                const isIterable = (reference as WsCustom).isIterable
                const node = findNodeByName(name)
                if (isIterable) {
                    const length = Math.floor(Math.random() * 7);
                    return [...Array(length).keys()].map(() => generateRandomNode(node))
                } else {
                    return generateRandomNode(node)
                }

            }
            default:
                throw new Error(`Cannot generate random reference`)
        }
    }

    const generateRandomContent = (content: WsContent) =>
        generateRandomReference(content.reference)

    return {generateRandomContent}
}