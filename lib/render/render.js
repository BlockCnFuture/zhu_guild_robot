import fs from 'fs';
import _render from 'art-template';

export default async function func(template_path, data) {
    try {
        let html = await fs.promises.readFile(template_path, 'utf8');
        let ret = _render.render(html, data);
        return ret;
    } catch (e) {
        return;
    }
}

global.render = func;