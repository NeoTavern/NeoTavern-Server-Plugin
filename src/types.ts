import { Request as ExpressRequest } from 'express';

export interface Request extends ExpressRequest {
  user: {
    directories: UserDirectoryList;
    [key: string]: any;
  };
}

export interface UserDirectoryList {
  root: string;
  [key: string]: string;
}

export interface SamplerPreset {
  [key: string]: unknown;
}

export interface SamplerPresetResponse {
  name: string;
  preset: SamplerPreset;
}

export interface ThemeDefinition {
  [key: string]: unknown;
}

export interface ThemeResponse {
  name: string;
  preset: ThemeDefinition;
}
