<script>
  import FileDrop from "svelte-tauri-filedrop";
  import { push } from "svelte-spa-router";
  import { convertFileSrc } from '@tauri-apps/api/tauri';
  import { readDir, readTextFile } from "@tauri-apps/api/fs";
  import { appDir, join } from "@tauri-apps/api/path";
  import { createDir, writeTextFile, BaseDirectory } from "@tauri-apps/api/fs";

  async function open(f) {
    let appDirPath = await appDir();
    await createDir(appDirPath, { recursive: true });
    let path = f[0];
    let contents = await readTextFile(path);
    path = path.replace(/tutors.json/, "");
    path = path.replace(/\\/g, "/");

    contents = contents.replace(/"img":\s*"https:\/\/\{\{COURSEURL\}\}\/+/g, `"img": "${path}`);
    let imgMatch = contents.matchAll(/"img": "(.*)"/g)
    const imgMatches = Array.from(imgMatch, result => result[1])
    for(const filePath of imgMatches) {
      let assetUrl = convertFileSrc(filePath)
      contents = contents.replace(filePath, assetUrl)
    }

    contents = contents.replace(/"pdf":\s*"https:\/\/\{\{COURSEURL\}\}\/+/g, `"pdf": "${path}`);
    let pdfMatch = contents.matchAll(/"pdf": "(.*)"/g)
    const pdfMatches = Array.from(pdfMatch, result => result[1])
    for(const filePath of pdfMatches) {
      let assetUrl = convertFileSrc(filePath)
      contents = contents.replace(filePath, assetUrl)
    }
    await writeTextFile("tutors.json", contents, { dir: BaseDirectory.App });
    const jsonData = JSON.parse(contents);
    const title = jsonData.id;
    push(`#/course/${title}`);
  }
</script>

<div class="container mx-auto mt-8">
  <div class="navbar rounded-box mb-2 justify-center bg-neutral p-4 text-neutral-content shadow-lg">
    <div class="flex-1">
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        xmlns:a="http://ns.adobe.com/AdobeSVGViewerExtensions/3.0/"
        x="0px"
        y="0px"
        height="40px"
        viewBox="0 0 54.5 39.4"
        style="enable-background:new 0 0 54.5 39.4;"
        xml:space="preserve"
      >
        <defs />
        <g>
          <path
            fill="#37919B"
            d="M51.5,0H3C1.4,0,0,1.4,0,3v33.3c0,1.7,1.4,3,3,3h48.5c1.7,0,3-1.4,3-3V3C54.5,1.4,53.1,0,51.5,0z M50,34.8H4.5
		V4.5H50V34.8z"
          />
          <g>
            <rect fill="#37919B" x="29" y="26.5" width="12.1" height="4.2" />
            <g>
              <path fill="#37919B" d="M13.4,13.5V8.7h19.1v4.8H26v17.2h-5.9V13.5H13.4z" />
            </g>
          </g>
        </g>
      </svg>
      <div class="mx-2 hidden flex-1 px-2 lg:block">
        <p class="text-lg font-bold">Tutors Reader</p>
        <p class="text-sm font-bold">Tutors Open Source Project</p>
      </div>
    </div>
    <a href="https://tutors.dev">
      <div class="btn btn-ghost rounded-2xl">
        <a href="https://tutors.dev/"> Homepage </a>
      </div>
    </a>
  </div>
  <div>
    <FileDrop extensions={["json"]} handleFiles={open} let:files>
      <div class="dropzone" class:droppable={files.length > 0}>
        <h2>Drop tutors.json file</h2>
      </div>
    </FileDrop>
  </div>
</div>

<style>
  .dropzone {
    padding: 40px;
    border: 2px dashed black;
    background: #eee;
  }
  .droppable {
    background: #d6dff0;
  }
</style>
