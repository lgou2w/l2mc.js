/// Unit test constants

export const P_TYPE = '__type__'
export const P_VALUE = '__value__'
export const P_ELEMENT = '__elementType__'

// Int8Array -> number[]
export function dataArray (data: Int8Array): number[] {
  const result: number[] = []
  for (let i = 0; i < data.byteLength; i++) {
    result.push(data[i])
  } return result
}
