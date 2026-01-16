import { Router } from 'express';
import { Request, SamplerPresetResponse, ThemeResponse } from './types';
import path from 'node:path';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import EventEmitter from 'node:events';
import process from 'node:process';

const ID = 'neo';
const SETTINGS_FILE = 'NeoSettings.json';
const PRESET_DIR = 'NeoSamplers';
const THEME_DIR = 'NeoThemes';

async function init(router: Router): Promise<void> {
  // @ts-ignore
  (process.serverEvents as EventEmitter).on('server-started', () => {
    console.log('NeoTavern Server Plugin: Server started');
  });

  // @ts-ignore
  router.get('/settings', async (request: Request, response) => {
    try {
      const filePath = path.join(request.user.directories.root, SETTINGS_FILE);
      const fileContent = await readFile(filePath, 'utf8');
      const settings = JSON.parse(fileContent);
      response.json(settings);
    } catch (error) {
      // If file doesn't exist, return default empty settings
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.json({});
      } else {
        console.error('Error reading settings:', error);
        response.status(500).json({ error: 'Failed to read settings' });
      }
    }
  });

  // Save settings endpoint,
  // @ts-ignore
  router.post('/settings', async (request: Request, response) => {
    try {
      const settings = request.body;
      const filePath = path.join(request.user.directories.root, SETTINGS_FILE);
      await writeFile(filePath, JSON.stringify(settings, null, 2), 'utf8');
      response.json({ success: true });
    } catch (error) {
      console.error('Error saving settings:', error);
      response.status(500).json({ error: 'Failed to save settings' });
    }
  });

  // @ts-ignore
  router.get('/samplers', async (request: Request, response) => {
    const baseDir = path.join(request.user.directories.root, PRESET_DIR);
    try {
      const entries = await readdir(baseDir, { withFileTypes: true });
      const presets: SamplerPresetResponse[] = [];
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const name = entry.name.slice(0, -5);
          const filePath = path.join(baseDir, entry.name);
          const content = await readFile(filePath, 'utf8');
          const presetData: Record<string, unknown> = JSON.parse(content);
          presets.push({ name, preset: presetData } as SamplerPresetResponse);
        }
      }
      response.json(presets);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.json([]);
      } else {
        console.error('Error reading presets:', error);
        response.status(500).json({ error: 'Failed to read presets' });
      }
    }
  });

  // @ts-ignore
  router.get('/samplers/:name', async (request: Request, response) => {
    const { name } = request.params;
    const baseDir = path.join(request.user.directories.root, PRESET_DIR);
    const filePath = path.join(baseDir, `${name}.json`);
    try {
      const content = await readFile(filePath, 'utf8');
      const presetData: Record<string, unknown> = JSON.parse(content);
      response.json({ name, preset: presetData } satisfies SamplerPresetResponse);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.status(404).json({ error: 'Preset not found' });
      } else {
        console.error('Error reading preset:', error);
        response.status(500).json({ error: 'Failed to read preset' });
      }
    }
  });

  // @ts-ignore
  router.post('/samplers', async (request: Request, response) => {
    const preset = request.body as SamplerPresetResponse;
    if (!preset?.name) {
      return response.status(400).json({ error: 'name is required in preset' });
    }
    const baseDir = path.join(request.user.directories.root, PRESET_DIR);
    await mkdir(baseDir, { recursive: true });
    const filePath = path.join(baseDir, `${preset.name}.json`);
    try {
      await writeFile(filePath, JSON.stringify(preset.preset, null, 2), 'utf8');
      response.json({ success: true });
    } catch (error) {
      console.error('Error saving preset:', error);
      response.status(500).json({ error: 'Failed to save preset' });
    }
  });

  // @ts-ignore
  router.delete('/samplers/:name', async (request: Request, response) => {
    const { name } = request.params;
    const baseDir = path.join(request.user.directories.root, PRESET_DIR);
    const filePath = path.join(baseDir, `${name}.json`);
    try {
      await unlink(filePath);
      response.sendStatus(204);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.status(404).json({ error: 'Preset not found' });
      } else {
        console.error('Error deleting preset:', error);
        response.status(500).json({ error: 'Failed to delete preset' });
      }
    }
  });

  // @ts-ignore
  router.get('/themes', async (request: Request, response) => {
    const baseDir = path.join(request.user.directories.root, THEME_DIR);
    try {
      const entries = await readdir(baseDir, { withFileTypes: true });
      const themes: ThemeResponse[] = [];
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          const name = entry.name.slice(0, -5);
          const filePath = path.join(baseDir, entry.name);
          const content = await readFile(filePath, 'utf8');
          const themeData: Record<string, unknown> = JSON.parse(content);
          themes.push({ name, preset: themeData } as ThemeResponse);
        }
      }
      response.json(themes);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.json([]);
      } else {
        console.error('Error reading themes:', error);
        response.status(500).json({ error: 'Failed to read themes' });
      }
    }
  });

  // @ts-ignore
  router.get('/themes/:name', async (request: Request, response) => {
    const { name } = request.params;
    const baseDir = path.join(request.user.directories.root, THEME_DIR);
    const filePath = path.join(baseDir, `${name}.json`);
    try {
      const content = await readFile(filePath, 'utf8');
      const themeData: Record<string, unknown> = JSON.parse(content);
      response.json({ name, preset: themeData } satisfies ThemeResponse);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.status(404).json({ error: 'Theme not found' });
      } else {
        console.error('Error reading theme:', error);
        response.status(500).json({ error: 'Failed to read theme' });
      }
    }
  });

  // @ts-ignore
  router.post('/themes', async (request: Request, response) => {
    const theme = request.body as ThemeResponse;
    if (!theme?.name || !theme?.preset) {
      return response.status(400).json({ error: 'Both name and preset are required' });
    }
    const baseDir = path.join(request.user.directories.root, THEME_DIR);
    await mkdir(baseDir, { recursive: true });
    const filePath = path.join(baseDir, `${theme.name}.json`);
    try {
      await writeFile(filePath, JSON.stringify(theme.preset, null, 2), 'utf8');
      response.json({ success: true });
    } catch (error) {
      console.error('Error saving theme:', error);
      response.status(500).json({ error: 'Failed to save theme' });
    }
  });

  // @ts-ignore
  router.delete('/themes/:name', async (request: Request, response) => {
    const { name } = request.params;
    const baseDir = path.join(request.user.directories.root, THEME_DIR);
    const filePath = path.join(baseDir, `${name}.json`);
    try {
      await unlink(filePath);
      response.sendStatus(204);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        response.status(404).json({ error: 'Theme not found' });
      } else {
        console.error('Error deleting theme:', error);
        response.status(500).json({ error: 'Failed to delete theme' });
      }
    }
  });
}

interface PluginInfo {
  id: string;
  name: string;
  description: string;
}

export default {
  init,
  exit: (): void => {},
  info: {
    id: ID,
    name: 'NeoTavern Server Plugin',
    description: 'Allows you to use NeoTavern-Frontend with SillyTavern.',
  },
} as {
  init: (router: Router) => Promise<void>;
  exit: () => void;
  info: PluginInfo;
};
