import { TransformFnParams } from 'class-transformer/types/interfaces';

export const lowerCaseTransformer = (params: TransformFnParams): any =>
  params.value?.toLowerCase().trim();
