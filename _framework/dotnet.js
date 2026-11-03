//! Licensed to the .NET Foundation under one or more agreements.
//! The .NET Foundation licenses this file to you under the MIT license.

var e=!0;const t=async()=>WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,8,1,6,0,6,64,25,11,11])),o=async()=>WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,15,1,13,0,65,1,253,15,65,2,253,15,253,128,2,11])),n=async()=>WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11])),r=Symbol.for("wasm promise_control");function i(e,t){let o=null;const n=new Promise((function(n,r){o={isDone:!1,promise:null,resolve:t=>{o.isDone||(o.isDone=!0,n(t),e&&e())},reject:e=>{o.isDone||(o.isDone=!0,r(e),t&&t())}}}));o.promise=n;const i=n;return i[r]=o,{promise:i,promise_control:o}}function s(e){return e[r]}function a(e){e&&function(e){return void 0!==e[r]}(e)||qe(!1,"Promise is not controllable")}const l="__mono_message__",c=["debug","log","trace","warn","info","error"],d="MONO_WASM: ";let u,f,m,g;function p(e){g=e}function h(e){if(Ne.diagnosticTracing){const t="function"==typeof e?e():e;console.debug(d+t)}}function b(e,...t){console.info(d+e,...t)}function w(e,...t){console.info(e,...t)}function y(e,...t){console.warn(d+e,...t)}function v(e,...t){if(t&&t.length>0&&t[0]&&"object"==typeof t[0]){if(t[0].silent)return;if(t[0].toString)return void console.error(d+e,t[0].toString())}console.error(d+e,...t)}let _,E,T="",x=(new Date).valueOf();function j(t,o,n){return function(...r){try{let i=r[0];if(void 0===i)i="undefined";else if(null===i)i="null";else if("function"==typeof i)i=i.toString();else if("string"!=typeof i)try{i=JSON.stringify(i)}catch(e){i=i.toString()}if("string"==typeof i&&e){if(Pe&&-1!==i.indexOf("keeping the worker alive for asynchronous operation"))return;if(0===i.indexOf("MONO_WASM: ")||0===i.indexOf("[MONO]")){const e=new Date;x!==e.valueOf()&&(T=e.toISOString().substring(11,23),x=e.valueOf()),i=`[${g} ${T}] ${i}`}}o(n?JSON.stringify({method:t,payload:i,arguments:r.slice(1)}):[t+i,...r.slice(1)])}catch(e){m.error(`proxyConsole failed: ${e}`)}}}function R(e,t,o){f=t,g=e,m={...t};const n=`${o}/console`.replace("https://","wss://").replace("http://","ws://");u=new WebSocket(n),u.addEventListener("error",O),u.addEventListener("close",D),function(){for(const e of c)f[e]=j(`console.${e}`,A,!0)}()}function S(e){let t=30;const o=()=>{u?0==u.bufferedAmount||0==t?(e&&w(e),function(){for(const e of c)f[e]=j(`console.${e}`,m.log,!1)}(),u.removeEventListener("error",O),u.removeEventListener("close",D),u.close(1e3,e),u=void 0):(t--,globalThis.setTimeout(o,100)):e&&m&&m.log(e)};o()}function A(e){u&&u.readyState===WebSocket.OPEN?u.send(e):m.log(e)}function O(e){m.error(`[${g}] proxy console websocket error: ${e}`,e)}function D(e){m.debug(`[${g}] proxy console websocket closed: ${e}`,e)}function k(){Ne.preferredIcuAsset=I(Ne.config);let e="invariant"==Ne.config.globalizationMode;if(!e)if(Ne.preferredIcuAsset)Ne.diagnosticTracing&&h("ICU data archive(s) available, disabling invariant mode");else{if("custom"===Ne.config.globalizationMode||"all"===Ne.config.globalizationMode||"sharded"===Ne.config.globalizationMode){const e="invariant globalization mode is inactive and no ICU data archives are available";throw v(`ERROR: ${e}`),new Error(e)}Ne.diagnosticTracing&&h("ICU data archive(s) not available, using invariant globalization mode"),e=!0,Ne.preferredIcuAsset=null}const t="DOTNET_SYSTEM_GLOBALIZATION_INVARIANT",o=Ne.config.environmentVariables;if(void 0===o[t]&&e&&(o[t]="1"),void 0===o.TZ)try{const e=Intl.DateTimeFormat().resolvedOptions().timeZone||null;e&&(o.TZ=e)}catch(e){b("failed to detect timezone, will fallback to UTC")}}function I(e){var t;if((null===(t=e.resources)||void 0===t?void 0:t.icu)&&"invariant"!=e.globalizationMode){const t=e.applicationCulture||(Ce?globalThis.navigator&&globalThis.navigator.languages&&globalThis.navigator.languages[0]:Intl.DateTimeFormat().resolvedOptions().locale),o=e.resources.icu;let n=null;if("custom"===e.globalizationMode){if(o.length>=1)return o[0].name}else t&&"all"!==e.globalizationMode?"sharded"===e.globalizationMode&&(n=function(e){const t=e.split("-")[0];return"en"===t||["fr","fr-FR","it","it-IT","de","de-DE","es","es-ES"].includes(e)?"icudt_EFIGS.dat":["zh","ko","ja"].includes(t)?"icudt_CJK.dat":"icudt_no_CJK.dat"}(t)):n="icudt.dat";if(n)for(let e=0;e<o.length;e++){const t=o[e];if(t.virtualPath===n)return t.name}}return e.globalizationMode="invariant",null}const P=class{constructor(e){this.url=e}toString(){return this.url}};async function C(e,t){try{const o="function"==typeof globalThis.fetch;if(De){const n=e.startsWith("file://");if(!n&&o)return globalThis.fetch(e,t||{credentials:"same-origin"});_||(E=ze.require("url"),_=ze.require("fs")),n&&(e=E.fileURLToPath(e));const r=await _.promises.readFile(e);return{ok:!0,headers:{length:0,get:()=>null},url:e,arrayBuffer:()=>r,json:()=>JSON.parse(r),text:()=>{throw new Error("NotImplementedException")}}}if(o)return globalThis.fetch(e,t||{credentials:"same-origin"});if("function"==typeof read)return{ok:!0,url:e,headers:{length:0,get:()=>null},arrayBuffer:()=>new Uint8Array(read(e,"binary")),json:()=>JSON.parse(read(e,"utf8")),text:()=>read(e,"utf8")}}catch(t){return{ok:!1,url:e,status:500,headers:{length:0,get:()=>null},statusText:"ERR28: "+t,arrayBuffer:()=>{throw t},json:()=>{throw t},text:()=>{throw t}}}throw new Error("No fetch implementation available")}function M(e){return"string"!=typeof e&&qe(!1,"url must be a string"),!L(e)&&0!==e.indexOf("./")&&0!==e.indexOf("../")&&globalThis.URL&&globalThis.document&&globalThis.document.baseURI&&(e=new URL(e,globalThis.document.baseURI).toString()),e}const U=/^[a-zA-Z][a-zA-Z\d+\-.]*?:\/\//,N=/[a-zA-Z]:[\\/]/;function L(e){return De||Me?e.startsWith("/")||e.startsWith("\\")||-1!==e.indexOf("///")||N.test(e):U.test(e)}let $,z=0;const W=[],F=[],B=new Map,V={"js-module-threads":!0,"js-module-runtime":!0,"js-module-dotnet":!0,"js-module-native":!0,"js-module-diagnostics":!0},q={...V,"js-module-library-initializer":!0},J={...V,dotnetwasm:!0,heap:!0,manifest:!0},H={...q,manifest:!0},Z={...q,dotnetwasm:!0},Q={dotnetwasm:!0,symbols:!0},G={...q,dotnetwasm:!0,symbols:!0},K={symbols:!0};function X(e){return!("icu"==e.behavior&&e.name!=Ne.preferredIcuAsset)}function Y(e,t,o){null!=t||(t=[]),qe(1==t.length,`Expect to have one ${o} asset in resources`);const n=t[0];return n.behavior=o,ee(n),e.push(n),n}function ee(e){J[e.behavior]&&B.set(e.behavior,e)}function te(e){qe(J[e],`Unknown single asset behavior ${e}`);const t=B.get(e);if(t&&!t.resolvedUrl)if(t.resolvedUrl=Ne.locateFile(t.name),V[t.behavior]){const e=he(t);e?("string"!=typeof e&&qe(!1,"loadBootResource response for 'dotnetjs' type should be a URL string"),t.resolvedUrl=e):t.resolvedUrl=ue(t.resolvedUrl,t.behavior)}else if("dotnetwasm"!==t.behavior)throw new Error(`Unknown single asset behavior ${e}`);return t}function oe(e){const t=te(e);return qe(t,`Single asset for ${e} not found`),t}let ne=!1;async function re(){if(!ne){ne=!0,Ne.diagnosticTracing&&h("mono_download_assets");try{const e=[],t=[],o=(e,t)=>{!G[e.behavior]&&X(e)&&Ne.expected_instantiated_assets_count++,!Z[e.behavior]&&X(e)&&(Ne.expected_downloaded_assets_count++,t.push(le(e)))};for(const t of W)o(t,e);for(const e of F)o(e,t);Ne.allDownloadsQueued.promise_control.resolve(),Promise.all([...e,...t]).then((()=>{Ne.allDownloadsFinished.promise_control.resolve()})).catch((e=>{throw Ne.err("Error in mono_download_assets: "+e),et(1,e),e})),await Ne.runtimeModuleLoaded.promise;const n=async e=>{const t=await e;if(t.buffer){if(!G[t.behavior]){t.buffer&&"object"==typeof t.buffer||qe(!1,"asset buffer must be array-like or buffer-like or promise of these"),"string"!=typeof t.resolvedUrl&&qe(!1,"resolvedUrl must be string");const e=t.resolvedUrl,o=await t.buffer,n=new Uint8Array(o);be(t),await Ue.beforeOnRuntimeInitialized.promise,Ue.instantiate_asset(t,e,n)}}else Q[t.behavior]?("symbols"===t.behavior&&(await Ue.instantiate_symbols_asset(t),be(t)),Q[t.behavior]&&++Ne.actual_downloaded_assets_count):(t.isOptional||qe(!1,"Expected asset to have the downloaded buffer"),!Z[t.behavior]&&X(t)&&Ne.expected_downloaded_assets_count--,!G[t.behavior]&&X(t)&&Ne.expected_instantiated_assets_count--)},r=[],i=[];for(const t of e)r.push(n(t));for(const e of t)i.push(n(e));Promise.all(r).then((()=>{Pe||Ue.coreAssetsInMemory.promise_control.resolve()})).catch((e=>{throw Ne.err("Error in mono_download_assets: "+e),et(1,e),e})),Promise.all(i).then((async()=>{Pe||(await Ue.coreAssetsInMemory.promise,Ue.allAssetsInMemory.promise_control.resolve())})).catch((e=>{throw Ne.err("Error in mono_download_assets: "+e),et(1,e),e}))}catch(e){throw Ne.err("Error in mono_download_assets: "+e),e}}}let ie=!1;function se(){if(ie)return;ie=!0;const e=Ne.config,t=[];if(e.assets)for(const t of e.assets)"object"!=typeof t&&qe(!1,`asset must be object, it was ${typeof t} : ${t}`),"string"!=typeof t.behavior&&qe(!1,"asset behavior must be known string"),"string"!=typeof t.name&&qe(!1,"asset name must be string"),t.resolvedUrl&&"string"!=typeof t.resolvedUrl&&qe(!1,"asset resolvedUrl could be string"),t.hash&&"string"!=typeof t.hash&&qe(!1,"asset resolvedUrl could be string"),t.pendingDownload&&"object"!=typeof t.pendingDownload&&qe(!1,"asset pendingDownload could be object"),t.isCore?W.push(t):F.push(t),ee(t);else if(e.resources){const o=e.resources;o.wasmNative||qe(!1,"resources.wasmNative must be defined"),o.jsModuleNative||qe(!1,"resources.jsModuleNative must be defined"),o.jsModuleRuntime||qe(!1,"resources.jsModuleRuntime must be defined"),o.jsModuleWorker||qe(!1,"resources.jsModuleWorker must be defined"),Y(F,o.wasmNative,"dotnetwasm"),Y(t,o.jsModuleNative,"js-module-native"),Y(t,o.jsModuleRuntime,"js-module-runtime"),o.jsModuleDiagnostics&&Y(t,o.jsModuleDiagnostics,"js-module-diagnostics"),Y(t,o.jsModuleWorker,"js-module-threads");const n=(e,t,o)=>{const n=e;n.behavior=t,o?(n.isCore=!0,W.push(n)):F.push(n)};if(o.coreAssembly)for(let e=0;e<o.coreAssembly.length;e++)n(o.coreAssembly[e],"assembly",!0);if(o.assembly)for(let e=0;e<o.assembly.length;e++)n(o.assembly[e],"assembly",!o.coreAssembly);if(0!=e.debugLevel&&Ne.isDebuggingSupported()){if(o.corePdb)for(let e=0;e<o.corePdb.length;e++)n(o.corePdb[e],"pdb",!0);if(o.pdb)for(let e=0;e<o.pdb.length;e++)n(o.pdb[e],"pdb",!o.corePdb)}if(e.loadAllSatelliteResources&&o.satelliteResources)for(const e in o.satelliteResources)for(let t=0;t<o.satelliteResources[e].length;t++){const r=o.satelliteResources[e][t];r.culture=e,n(r,"resource",!o.coreAssembly)}if(o.coreVfs)for(let e=0;e<o.coreVfs.length;e++)n(o.coreVfs[e],"vfs",!0);if(o.vfs)for(let e=0;e<o.vfs.length;e++)n(o.vfs[e],"vfs",!o.coreVfs);const r=I(e);if(r&&o.icu)for(let e=0;e<o.icu.length;e++){const t=o.icu[e];t.name===r&&n(t,"icu",!1)}if(o.wasmSymbols)for(let e=0;e<o.wasmSymbols.length;e++)n(o.wasmSymbols[e],"symbols",!1)}if(e.appsettings)for(let t=0;t<e.appsettings.length;t++){const o=e.appsettings[t],n=we(o);"appsettings.json"!==n&&n!==`appsettings.${e.applicationEnvironment}.json`||F.push({name:o,behavior:"vfs",cache:"no-cache",useCredentials:!0})}e.assets=[...W,...F,...t]}async function ae(e){const t=await le(e);return await t.pendingDownloadInternal.response,t.buffer}async function le(e){try{return await ce(e)}catch(t){if(!Ne.enableDownloadRetry)throw t;if(Me||De)throw t;if(e.pendingDownload&&e.pendingDownloadInternal==e.pendingDownload)throw t;if(e.resolvedUrl&&-1!=e.resolvedUrl.indexOf("file://"))throw t;if(t&&404==t.status)throw t;e.pendingDownloadInternal=void 0,await Ne.allDownloadsQueued.promise;try{return Ne.diagnosticTracing&&h(`Retrying download '${e.name}'`),await ce(e)}catch(t){return e.pendingDownloadInternal=void 0,await new Promise((e=>globalThis.setTimeout(e,100))),Ne.diagnosticTracing&&h(`Retrying download (2) '${e.name}' after delay`),await ce(e)}}}async function ce(e){for(;$;)await $.promise;try{++z,z==Ne.maxParallelDownloads&&(Ne.diagnosticTracing&&h("Throttling further parallel downloads"),$=i());const t=await async function(e){if(e.pendingDownload&&(e.pendingDownloadInternal=e.pendingDownload),e.pendingDownloadInternal&&e.pendingDownloadInternal.response)return e.pendingDownloadInternal.response;if(e.buffer){const t=await e.buffer;return e.resolvedUrl||(e.resolvedUrl="undefined://"+e.name),e.pendingDownloadInternal={url:e.resolvedUrl,name:e.name,response:Promise.resolve({ok:!0,arrayBuffer:()=>t,json:()=>JSON.parse(new TextDecoder("utf-8").decode(t)),text:()=>{throw new Error("NotImplementedException")},headers:{get:()=>{}}})},e.pendingDownloadInternal.response}const t=e.loadRemote&&Ne.config.remoteSources?Ne.config.remoteSources:[""];let o;for(let n of t){n=n.trim(),"./"===n&&(n="");const t=de(e,n);e.name===t?Ne.diagnosticTracing&&h(`Attempting to download '${t}'`):Ne.diagnosticTracing&&h(`Attempting to download '${t}' for ${e.name}`);try{e.resolvedUrl=t;const n=ge(e);if(e.pendingDownloadInternal=n,o=await n.response,!o||!o.ok)continue;return o}catch(e){o||(o={ok:!1,url:t,status:0,statusText:""+e});continue}}const n=e.isOptional||e.name.match(/\.pdb$/)&&Ne.config.ignorePdbLoadErrors;if(o||qe(!1,`Response undefined ${e.name}`),!n){const t=new Error(`download '${o.url}' for ${e.name} failed ${o.status} ${o.statusText}`);throw t.status=o.status,t}b(`optional download '${o.url}' for ${e.name} failed ${o.status} ${o.statusText}`)}(e);return t?(Q[e.behavior]||(e.buffer=await t.arrayBuffer(),++Ne.actual_downloaded_assets_count),e):e}finally{if(--z,$&&z==Ne.maxParallelDownloads-1){Ne.diagnosticTracing&&h("Resuming more parallel downloads");const e=$;$=void 0,e.promise_control.resolve()}}}function de(e,t){let o;return null==t&&qe(!1,`sourcePrefix must be provided for ${e.name}`),e.resolvedUrl?o=e.resolvedUrl:(o=""===t?"assembly"===e.behavior||"pdb"===e.behavior?e.name:"resource"===e.behavior&&e.culture&&""!==e.culture?`${e.culture}/${e.name}`:e.name:t+e.name,o=ue(Ne.locateFile(o),e.behavior)),o&&"string"==typeof o||qe(!1,"attemptUrl need to be path or url string"),o}function ue(e,t){return Ne.modulesUniqueQuery&&H[t]&&(e+=Ne.modulesUniqueQuery),e}let fe=0;const me=new Set;function ge(e){try{e.resolvedUrl||qe(!1,"Request's resolvedUrl must be set");const t=function(e){let t=e.resolvedUrl;if(Ne.loadBootResource){const o=he(e);if(o instanceof Promise)return o;"string"==typeof o&&(t=o)}const o={};return e.cache?o.cache=e.cache:Ne.config.disableNoCacheFetch||(o.cache="no-cache"),e.useCredentials?o.credentials="include":!Ne.config.disableIntegrityCheck&&e.hash&&(o.integrity=e.hash),Ne.fetch_like(t,o)}(e),o={name:e.name,url:e.resolvedUrl,response:t};return me.add(e.name),o.response.then((()=>{"assembly"==e.behavior&&Ne.loadedAssemblies.push(e.name),fe++,Ne.onDownloadResourceProgress&&Ne.onDownloadResourceProgress(fe,me.size)})),o}catch(t){const o={ok:!1,url:e.resolvedUrl,status:500,statusText:"ERR29: "+t,arrayBuffer:()=>{throw t},json:()=>{throw t}};return{name:e.name,url:e.resolvedUrl,response:Promise.resolve(o)}}}const pe={resource:"assembly",assembly:"assembly",pdb:"pdb",icu:"globalization",vfs:"configuration",manifest:"manifest",dotnetwasm:"dotnetwasm","js-module-dotnet":"dotnetjs","js-module-native":"dotnetjs","js-module-runtime":"dotnetjs","js-module-threads":"dotnetjs"};function he(e){var t;if(Ne.loadBootResource){const o=null!==(t=e.hash)&&void 0!==t?t:"",n=e.resolvedUrl,r=pe[e.behavior];if(r){const t=Ne.loadBootResource(r,e.name,n,o,e.behavior);return"string"==typeof t?M(t):t}}}function be(e){e.pendingDownloadInternal=null,e.pendingDownload=null,e.buffer=null,e.moduleExports=null}function we(e){let t=e.lastIndexOf("/");return t>=0&&t++,e.substring(t)}async function ye(e){e&&await Promise.all((null!=e?e:[]).map((e=>async function(e){try{const t=e.name;if(!e.moduleExports){const o=ue(Ne.locateFile(t),"js-module-library-initializer");Ne.diagnosticTracing&&h(`Attempting to import '${o}' for ${e}`),e.moduleExports=await import(/*! webpackIgnore: true */o)}Ne.libraryInitializers.push({scriptName:t,exports:e.moduleExports})}catch(t){y(`Failed to import library initializer '${e}': ${t}`)}}(e))))}async function ve(e,t){if(!Ne.libraryInitializers)return;const o=[];for(let n=0;n<Ne.libraryInitializers.length;n++){const r=Ne.libraryInitializers[n];r.exports[e]&&o.push(_e(r.scriptName,e,(()=>r.exports[e](...t))))}await Promise.all(o)}async function _e(e,t,o){try{await o()}catch(o){throw y(`Failed to invoke '${t}' on library initializer '${e}': ${o}`),et(1,o),o}}function Ee(e,t){if(e===t)return e;const o={...t};return void 0!==o.assets&&o.assets!==e.assets&&(o.assets=[...e.assets||[],...o.assets||[]]),void 0!==o.resources&&(o.resources=xe(e.resources||{assembly:[],jsModuleNative:[],jsModuleRuntime:[],wasmNative:[]},o.resources)),void 0!==o.environmentVariables&&(o.environmentVariables={...e.environmentVariables||{},...o.environmentVariables||{}}),void 0!==o.runtimeOptions&&o.runtimeOptions!==e.runtimeOptions&&(o.runtimeOptions=[...e.runtimeOptions||[],...o.runtimeOptions||[]]),Object.assign(e,o)}function Te(e,t){if(e===t)return e;const o={...t};return o.config&&(e.config||(e.config={}),o.config=Ee(e.config,o.config)),Object.assign(e,o)}function xe(e,t){if(e===t)return e;const o={...t};return void 0!==o.coreAssembly&&(o.coreAssembly=[...e.coreAssembly||[],...o.coreAssembly||[]]),void 0!==o.assembly&&(o.assembly=[...e.assembly||[],...o.assembly||[]]),void 0!==o.lazyAssembly&&(o.lazyAssembly=[...e.lazyAssembly||[],...o.lazyAssembly||[]]),void 0!==o.corePdb&&(o.corePdb=[...e.corePdb||[],...o.corePdb||[]]),void 0!==o.pdb&&(o.pdb=[...e.pdb||[],...o.pdb||[]]),void 0!==o.jsModuleWorker&&(o.jsModuleWorker=[...e.jsModuleWorker||[],...o.jsModuleWorker||[]]),void 0!==o.jsModuleNative&&(o.jsModuleNative=[...e.jsModuleNative||[],...o.jsModuleNative||[]]),void 0!==o.jsModuleDiagnostics&&(o.jsModuleDiagnostics=[...e.jsModuleDiagnostics||[],...o.jsModuleDiagnostics||[]]),void 0!==o.jsModuleRuntime&&(o.jsModuleRuntime=[...e.jsModuleRuntime||[],...o.jsModuleRuntime||[]]),void 0!==o.wasmSymbols&&(o.wasmSymbols=[...e.wasmSymbols||[],...o.wasmSymbols||[]]),void 0!==o.wasmNative&&(o.wasmNative=[...e.wasmNative||[],...o.wasmNative||[]]),void 0!==o.icu&&(o.icu=[...e.icu||[],...o.icu||[]]),void 0!==o.satelliteResources&&(o.satelliteResources=function(e,t){if(e===t)return e;for(const o in t)e[o]=[...e[o]||[],...t[o]||[]];return e}(e.satelliteResources||{},o.satelliteResources||{})),void 0!==o.modulesAfterConfigLoaded&&(o.modulesAfterConfigLoaded=[...e.modulesAfterConfigLoaded||[],...o.modulesAfterConfigLoaded||[]]),void 0!==o.modulesAfterRuntimeReady&&(o.modulesAfterRuntimeReady=[...e.modulesAfterRuntimeReady||[],...o.modulesAfterRuntimeReady||[]]),void 0!==o.extensions&&(o.extensions={...e.extensions||{},...o.extensions||{}}),void 0!==o.vfs&&(o.vfs=[...e.vfs||[],...o.vfs||[]]),Object.assign(e,o)}function je(){const e=Ne.config;if(e.environmentVariables=e.environmentVariables||{},e.runtimeOptions=e.runtimeOptions||[],e.resources=e.resources||{assembly:[],jsModuleNative:[],jsModuleWorker:[],jsModuleRuntime:[],wasmNative:[],vfs:[],satelliteResources:{}},e.assets){Ne.diagnosticTracing&&h("config.assets is deprecated, use config.resources instead");for(const t of e.assets){const o={};switch(t.behavior){case"assembly":o.assembly=[t];break;case"pdb":o.pdb=[t];break;case"resource":o.satelliteResources={},o.satelliteResources[t.culture]=[t];break;case"icu":o.icu=[t];break;case"symbols":o.wasmSymbols=[t];break;case"vfs":o.vfs=[t];break;case"dotnetwasm":o.wasmNative=[t];break;case"js-module-threads":o.jsModuleWorker=[t];break;case"js-module-runtime":o.jsModuleRuntime=[t];break;case"js-module-native":o.jsModuleNative=[t];break;case"js-module-diagnostics":o.jsModuleDiagnostics=[t];break;case"js-module-dotnet":break;default:throw new Error(`Unexpected behavior ${t.behavior} of asset ${t.name}`)}xe(e.resources,o)}}e.debugLevel,e.applicationEnvironment||(e.applicationEnvironment="Production"),Number.isInteger(e.pthreadPoolInitialSize)||(e.pthreadPoolInitialSize=5),Number.isInteger(e.pthreadPoolUnusedSize)||(e.pthreadPoolUnusedSize=1),null==e.jsThreadBlockingMode&&(e.jsThreadBlockingMode="PreventSynchronousJSExport"),void 0===e.environmentVariables.MONO_SLEEP_ABORT_LIMIT&&(e.environmentVariables.MONO_SLEEP_ABORT_LIMIT="5000"),e.applicationCulture&&(e.environmentVariables.LANG=`${e.applicationCulture}.UTF-8`),Ue.diagnosticTracing=Ne.diagnosticTracing=!!e.diagnosticTracing,Ue.waitForDebugger=e.waitForDebugger,Ne.maxParallelDownloads=e.maxParallelDownloads||Ne.maxParallelDownloads,Ne.enableDownloadRetry=void 0!==e.enableDownloadRetry?e.enableDownloadRetry:Ne.enableDownloadRetry}let Re=!1;async function Se(e){var t;if(Re)return void await Ne.afterConfigLoaded.promise;let o;try{if(e.configSrc||Ne.config&&0!==Object.keys(Ne.config).length&&(Ne.config.assets||Ne.config.resources)||(e.configSrc="dotnet.boot.js"),o=e.configSrc,Re=!0,o&&(Ne.diagnosticTracing&&h("mono_wasm_load_config"),await async function(e){const t=e.configSrc,o=Ne.locateFile(t);let n=null;void 0!==Ne.loadBootResource&&(n=Ne.loadBootResource("manifest",t,o,"","manifest"));let r,i=null;if(n)if("string"==typeof n)n.includes(".json")?(i=await s(M(n)),r=await Oe(i)):r=(await import(M(n))).config;else{const e=await n;"function"==typeof e.json?(i=e,r=await Oe(i)):r=e.config}else o.includes(".json")?(i=await s(ue(o,"manifest")),r=await Oe(i)):r=(await import(ue(o,"manifest"))).config;function s(e){return Ne.fetch_like(e,{method:"GET",credentials:"include",cache:"no-cache"})}Ne.config.applicationEnvironment&&(r.applicationEnvironment=Ne.config.applicationEnvironment),Ee(Ne.config,r)}(e)),je(),await ye(null===(t=Ne.config.resources)||void 0===t?void 0:t.modulesAfterConfigLoaded),await ve("onRuntimeConfigLoaded",[Ne.config]),e.onConfigLoaded)try{await e.onConfigLoaded(Ne.config,$e),je()}catch(e){throw v("onConfigLoaded() failed",e),e}je(),Ne.afterConfigLoaded.promise_control.resolve(Ne.config)}catch(t){const n=`Failed to load config file ${o} ${t} ${null==t?void 0:t.stack}`;throw Ne.config=e.config=Object.assign(Ne.config,{message:n,error:t,isError:!0}),et(1,new Error(n)),t}}function Ae(){return!!globalThis.navigator&&(Ne.isChromium||Ne.isFirefox)}async function Oe(e){const t=Ne.config,o=await e.json();t.applicationEnvironment||o.applicationEnvironment||(o.applicationEnvironment=e.headers.get("Blazor-Environment")||e.headers.get("DotNet-Environment")||void 0),o.environmentVariables||(o.environmentVariables={});const n=e.headers.get("DOTNET-MODIFIABLE-ASSEMBLIES");n&&(o.environmentVariables.DOTNET_MODIFIABLE_ASSEMBLIES=n);const r=e.headers.get("ASPNETCORE-BROWSER-TOOLS");return r&&(o.environmentVariables.__ASPNETCORE_BROWSER_TOOLS=r),o}"function"!=typeof importScripts||globalThis.onmessage||(globalThis.dotnetSidecar=!0);const De="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,ke="function"==typeof importScripts,Ie=ke&&"undefined"!=typeof dotnetSidecar,Pe=ke&&!Ie,Ce="object"==typeof window||ke&&!De,Me=!Ce&&!De;let Ue={},Ne={},Le={},$e={},ze={},We=!1;const Fe={},Be={config:Fe},Ve={mono:{},binding:{},internal:ze,module:Be,loaderHelpers:Ne,runtimeHelpers:Ue,diagnosticHelpers:Le,api:$e};function qe(e,t){if(e)return;const o="Assert failed: "+("function"==typeof t?t():t),n=new Error(o);v(o,n),Ue.nativeAbort(n)}function Je(){return void 0!==Ne.exitCode}function He(){return Ue.runtimeReady&&!Je()}function Ze(){Je()&&qe(!1,`.NET runtime already exited with ${Ne.exitCode} ${Ne.exitReason}. You can use runtime.runMain() which doesn't exit the runtime.`),Pe?Ue.runtimeReady||qe(!1,"The WebWorker is not attached to the runtime. See https://github.com/dotnet/runtime/blob/main/src/mono/wasm/threads.md#JS-interop-on-dedicated-threads"):Ue.runtimeReady||qe(!1,".NET runtime didn't start yet. Please call dotnet.create() first.")}function Qe(){Ce&&(globalThis.addEventListener("unhandledrejection",ot),globalThis.addEventListener("error",nt))}let Ge,Ke;function Xe(e){Ke&&Ke(e),et(e,Ne.exitReason)}function Ye(e){var t;if(Ge&&Ge(e||Ne.exitReason),(null===(t=Ne.config)||void 0===t?void 0:t.dumpThreadsOnNonZeroExit)&&Ue.mono_wasm_print_thread_dump&&void 0===Ne.exitCode)try{Ue.mono_wasm_print_thread_dump()}catch(e){}et(1,e||Ne.exitReason)}function et(t,o){var n,r;const i=o&&"object"==typeof o;t=i&&"number"==typeof o.status?o.status:void 0===t?-1:t;const s=i&&"string"==typeof o.message?o.message:""+o;(o=i?o:Ue.ExitStatus?function(e,t){const o=new Ue.ExitStatus(e);return o.message=t,o.toString=()=>t,o}(t,s):new Error("Exit with code "+t+" "+s)).status=t,o.message||(o.message=s);const a=""+(o.stack||(new Error).stack);try{Object.defineProperty(o,"stack",{get:()=>a})}catch(e){}const l=!!o.silent;if(o.silent=!0,Je())Ne.diagnosticTracing&&h("mono_exit called after exit");else{try{Be.onAbort==Ye&&(Be.onAbort=Ge),Be.onExit==Xe&&(Be.onExit=Ke),Ce&&(globalThis.removeEventListener("unhandledrejection",ot),globalThis.removeEventListener("error",nt)),Ue.runtimeReady?(Ue.jiterpreter_dump_stats&&Ue.jiterpreter_dump_stats(!1),0===t&&(null===(n=Ne.config)||void 0===n?void 0:n.interopCleanupOnExit)&&Ue.forceDisposeProxies(!0,!0),e&&0!==t&&(null===(r=Ne.config)||void 0===r?void 0:r.dumpThreadsOnNonZeroExit)&&Ue.dumpThreads()):(Ne.diagnosticTracing&&h(`abort_startup, reason: ${o}`),function(e){Ne.allDownloadsQueued.promise_control.reject(e),Ne.allDownloadsFinished.promise_control.reject(e),Ne.afterConfigLoaded.promise_control.reject(e),Ne.wasmCompilePromise.promise_control.reject(e),Ne.runtimeModuleLoaded.promise_control.reject(e),Ue.dotnetReady&&(Ue.dotnetReady.promise_control.reject(e),Ue.afterInstantiateWasm.promise_control.reject(e),Ue.beforePreInit.promise_control.reject(e),Ue.afterPreInit.promise_control.reject(e),Ue.afterPreRun.promise_control.reject(e),Ue.beforeOnRuntimeInitialized.promise_control.reject(e),Ue.afterOnRuntimeInitialized.promise_control.reject(e),Ue.afterPostRun.promise_control.reject(e))}(o))}catch(e){y("mono_exit A failed",e)}try{l||(function(e,t){if(0!==e&&t){const e=Ue.ExitStatus&&t instanceof Ue.ExitStatus?h:v;"string"==typeof t?e(t):(void 0===t.stack&&(t.stack=(new Error).stack+""),t.message?e(Ue.stringify_as_error_with_stack?Ue.stringify_as_error_with_stack(t.message+"\n"+t.stack):t.message+"\n"+t.stack):e(JSON.stringify(t)))}!Pe&&Ne.config&&(Ne.config.logExitCode?Ne.config.forwardConsoleLogsToWS?S("WASM EXIT "+e):w("WASM EXIT "+e):Ne.config.forwardConsoleLogsToWS&&S())}(t,o),function(e){if(Ce&&!Pe&&Ne.config&&Ne.config.appendElementOnExit&&document){const t=document.createElement("label");t.id="tests_done",0!==e&&(t.style.background="red"),t.innerHTML=""+e,document.body.appendChild(t)}}(t))}catch(e){y("mono_exit B failed",e)}Ne.exitCode=t,Ne.exitReason||(Ne.exitReason=o),!Pe&&Ue.runtimeReady&&Be.runtimeKeepalivePop()}if(Ne.config&&Ne.config.asyncFlushOnExit&&0===t)throw(async()=>{try{await async function(){try{const e=await import(/*! webpackIgnore: true */"process"),t=e=>new Promise(((t,o)=>{e.on("error",o),e.end("","utf8",t)})),o=t(e.stderr),n=t(e.stdout);let r;const i=new Promise((e=>{r=setTimeout((()=>e("timeout")),1e3)}));await Promise.race([Promise.all([n,o]),i]),clearTimeout(r)}catch(e){v(`flushing std* streams failed: ${e}`)}}()}finally{tt(t,o)}})(),o;tt(t,o)}function tt(e,t){if(Pe&&Ue.runtimeReady&&Ue.nativeAbort)throw Ue.nativeAbort(t),t;if(Ue.runtimeReady&&Ue.nativeExit)try{Ue.nativeExit(e)}catch(e){!Ue.ExitStatus||e instanceof Ue.ExitStatus||y("set_exit_code_and_quit_now failed: "+e.toString())}if(0!==e||!Ce)throw De&&ze.process?ze.process.exit(e):Ue.quit&&Ue.quit(e,t),t}function ot(e){rt(e,e.reason,"rejection")}function nt(e){rt(e,e.error,"error")}function rt(e,t,o){e.preventDefault();try{t||(t=new Error("Unhandled "+o)),void 0===t.stack&&(t.stack=(new Error).stack),t.stack=t.stack+"",t.silent||(v("Unhandled error:",t),et(1,t))}catch(e){}}!function(e){if(We)throw new Error("Loader module already loaded");We=!0,Ue=e.runtimeHelpers,Ne=e.loaderHelpers,Le=e.diagnosticHelpers,$e=e.api,ze=e.internal,Object.assign($e,{INTERNAL:ze,invokeLibraryInitializers:ve}),Object.assign(e.module,{config:Ee(Fe,{environmentVariables:{}})});const r={mono_wasm_bindings_is_ready:!1,config:e.module.config,diagnosticTracing:!1,nativeAbort:e=>{throw e||new Error("abort")},nativeExit:e=>{throw new Error("exit:"+e)}},l={gitHash:"0427b9abbead3fa64c6655eb4290c537397131fa",config:e.module.config,diagnosticTracing:!1,maxParallelDownloads:16,enableDownloadRetry:!0,_loaded_files:[],loadedFiles:[],loadedAssemblies:[],libraryInitializers:[],workerNextNumber:1,actual_downloaded_assets_count:0,actual_instantiated_assets_count:0,expected_downloaded_assets_count:0,expected_instantiated_assets_count:0,afterConfigLoaded:i(),allDownloadsQueued:i(),allDownloadsFinished:i(),wasmCompilePromise:i(),runtimeModuleLoaded:i(),loadingWorkers:i(),is_exited:Je,is_runtime_running:He,assert_runtime_running:Ze,mono_exit:et,createPromiseController:i,getPromiseController:s,assertIsControllablePromise:a,mono_download_assets:re,resolve_single_asset_path:oe,setup_proxy_console:R,set_thread_prefix:p,installUnhandledErrorHandler:Qe,retrieve_asset_download:ae,invokeLibraryInitializers:ve,isDebuggingSupported:Ae,exceptions:t,simd:n,relaxedSimd:o};Object.assign(Ue,r),Object.assign(Ne,l)}(Ve);let it,st,at,lt=!1,ct=!1;async function dt(e){if(!ct){if(ct=!0,Ce&&Ne.config.forwardConsoleLogsToWS&&void 0!==globalThis.WebSocket&&R("main",globalThis.console,globalThis.location.origin),Be||qe(!1,"Null moduleConfig"),Ne.config||qe(!1,"Null moduleConfig.config"),"function"==typeof e){const t=e(Ve.api);if(t.ready)throw new Error("Module.ready couldn't be redefined.");Object.assign(Be,t),Te(Be,t)}else{if("object"!=typeof e)throw new Error("Can't use moduleFactory callback of createDotnetRuntime function.");Te(Be,e)}await async function(e){if(De){const e=await import(/*! webpackIgnore: true */"process"),t=14;if(e.versions.node.split(".")[0]<t)throw new Error(`NodeJS at '${e.execPath}' has too low version '${e.versions.node}', please use at least ${t}. See also https://aka.ms/dotnet-wasm-features`)}const t=/*! webpackIgnore: true */import.meta.url,o=t.indexOf("?");var n;if(o>0&&(Ne.modulesUniqueQuery=t.substring(o)),Ne.scriptUrl=t.replace(/\\/g,"/").replace(/[?#].*/,""),Ne.scriptDirectory=(n=Ne.scriptUrl).slice(0,n.lastIndexOf("/"))+"/",Ne.locateFile=e=>"URL"in globalThis&&globalThis.URL!==P?new URL(e,Ne.scriptDirectory).toString():L(e)?e:Ne.scriptDirectory+e,Ne.fetch_like=C,Ne.out=console.log,Ne.err=console.error,Ne.onDownloadResourceProgress=e.onDownloadResourceProgress,Ce&&globalThis.navigator){const e=globalThis.navigator,t=e.userAgentData&&e.userAgentData.brands;t&&t.length>0?Ne.isChromium=t.some((e=>"Google Chrome"===e.brand||"Microsoft Edge"===e.brand||"Chromium"===e.brand)):e.userAgent&&(Ne.isChromium=e.userAgent.includes("Chrome"),Ne.isFirefox=e.userAgent.includes("Firefox"))}ze.require=De?await import(/*! webpackIgnore: true */"module").then((e=>e.createRequire(/*! webpackIgnore: true */import.meta.url))):Promise.resolve((()=>{throw new Error("require not supported")})),void 0===globalThis.URL&&(globalThis.URL=P)}(Be)}}async function ut(e){return await dt(e),Ge=Be.onAbort,Ke=Be.onExit,Be.onAbort=Ye,Be.onExit=Xe,Be.ENVIRONMENT_IS_PTHREAD?async function(){(function(){const e=new MessageChannel,t=e.port1,o=e.port2;t.addEventListener("message",(e=>{var n,r;n=JSON.parse(e.data.config),r=JSON.parse(e.data.monoThreadInfo),lt?Ne.diagnosticTracing&&h("mono config already received"):(Ee(Ne.config,n),Ue.monoThreadInfo=r,je(),Ne.diagnosticTracing&&h("mono config received"),lt=!0,Ne.afterConfigLoaded.promise_control.resolve(Ne.config),Ce&&n.forwardConsoleLogsToWS&&void 0!==globalThis.WebSocket&&Ne.setup_proxy_console("worker-idle",console,globalThis.location.origin)),t.close(),o.close()}),{once:!0}),t.start(),self.postMessage({[l]:{monoCmd:"preload",port:o}},[o])})(),await Ne.afterConfigLoaded.promise,function(){const e=Ne.config;e.assets||qe(!1,"config.assets must be defined");for(const t of e.assets)ee(t),K[t.behavior]&&F.push(t)}(),setTimeout((async()=>{try{await re()}catch(e){et(1,e)}}),0);const e=ft(),t=await Promise.all(e);return await mt(t),Be}():async function(){var e;await Se(Be),se();const t=ft();(async function(){try{const e=oe("dotnetwasm");await le(e),e&&e.pendingDownloadInternal&&e.pendingDownloadInternal.response||qe(!1,"Can't load dotnet.native.wasm");const t=await e.pendingDownloadInternal.response,o=t.headers&&t.headers.get?t.headers.get("Content-Type"):void 0;let n;if("function"==typeof WebAssembly.compileStreaming&&"application/wasm"===o)n=await WebAssembly.compileStreaming(t);else{Ce&&"application/wasm"!==o&&y('WebAssembly resource does not have the expected content type "application/wasm", so falling back to slower ArrayBuffer instantiation.');const e=await t.arrayBuffer();Ne.diagnosticTracing&&h("instantiate_wasm_module buffered"),n=Me?await Promise.resolve(new WebAssembly.Module(e)):await WebAssembly.compile(e)}e.pendingDownloadInternal=null,e.pendingDownload=null,e.buffer=null,e.moduleExports=null,Ne.wasmCompilePromise.promise_control.resolve(n)}catch(e){Ne.wasmCompilePromise.promise_control.reject(e)}})(),setTimeout((async()=>{try{k(),function(){const e=oe("js-module-threads"),t=[];for(let o=0;o<Ne.config.pthreadPoolInitialSize;o++){const o=Ne.workerNextNumber++,n=new Worker(e.resolvedUrl,{name:"dotnet-worker-"+o.toString().padStart(3,"0"),type:"module"});n.info={workerNumber:o,pthreadId:0,reuseCount:0,updateCount:0,threadPrefix:"          -    ",threadName:"emscripten-pool"},t.push(n)}Ne.loadingWorkers.promise_control.resolve(t)}(),await re()}catch(e){et(1,e)}}),0);const o=await Promise.all(t);return await mt(o),await Ue.dotnetReady.promise,await ye(null===(e=Ne.config.resources)||void 0===e?void 0:e.modulesAfterRuntimeReady),await ve("onRuntimeReady",[Ve.api]),$e}()}function ft(){const e=oe("js-module-runtime"),t=oe("js-module-native");if(it&&st)return[it,st,at];"object"==typeof e.moduleExports?it=e.moduleExports:(Ne.diagnosticTracing&&h(`Attempting to import '${e.resolvedUrl}' for ${e.name}`),it=import(/*! webpackIgnore: true */e.resolvedUrl)),"object"==typeof t.moduleExports?st=t.moduleExports:(Ne.diagnosticTracing&&h(`Attempting to import '${t.resolvedUrl}' for ${t.name}`),st=import(/*! webpackIgnore: true */t.resolvedUrl));const o=te("js-module-diagnostics");return o&&("object"==typeof o.moduleExports?at=o.moduleExports:(Ne.diagnosticTracing&&h(`Attempting to import '${o.resolvedUrl}' for ${o.name}`),at=import(/*! webpackIgnore: true */o.resolvedUrl))),[it,st,at]}async function mt(e){const{initializeExports:t,initializeReplacements:o,configureRuntimeStartup:n,configureEmscriptenStartup:r,configureWorkerStartup:i,setRuntimeGlobals:s,passEmscriptenInternals:a}=e[0],{default:l}=e[1],c=e[2];s(Ve),t(Ve),c&&c.setRuntimeGlobals(Ve),await n(Be),Ne.runtimeModuleLoaded.promise_control.resolve(),l((e=>(Object.assign(Be,{ready:e.ready,__dotnet_runtime:{initializeReplacements:o,configureEmscriptenStartup:r,configureWorkerStartup:i,passEmscriptenInternals:a}}),Be))).catch((e=>{if(e.message&&e.message.toLowerCase().includes("out of memory"))throw new Error(".NET runtime has failed to start, because too much memory was requested. Please decrease the memory by adjusting EmccMaximumHeapSize. See also https://aka.ms/dotnet-wasm-features");throw e}))}const gt=new class{withModuleConfig(e){try{return Te(Be,e),this}catch(e){throw et(1,e),e}}withOnConfigLoaded(e){try{return Te(Be,{onConfigLoaded:e}),this}catch(e){throw et(1,e),e}}withConsoleForwarding(){try{return Ee(Fe,{forwardConsoleLogsToWS:!0}),this}catch(e){throw et(1,e),e}}withExitOnUnhandledError(){try{return Ee(Fe,{exitOnUnhandledError:!0}),Qe(),this}catch(e){throw et(1,e),e}}withAsyncFlushOnExit(){try{return Ee(Fe,{asyncFlushOnExit:!0}),this}catch(e){throw et(1,e),e}}withExitCodeLogging(){try{return Ee(Fe,{logExitCode:!0}),this}catch(e){throw et(1,e),e}}withElementOnExit(){try{return Ee(Fe,{appendElementOnExit:!0}),this}catch(e){throw et(1,e),e}}withInteropCleanupOnExit(){try{return Ee(Fe,{interopCleanupOnExit:!0}),this}catch(e){throw et(1,e),e}}withDumpThreadsOnNonZeroExit(){try{return Ee(Fe,{dumpThreadsOnNonZeroExit:!0}),this}catch(e){throw et(1,e),e}}withWaitingForDebugger(e){try{return Ee(Fe,{waitForDebugger:e}),this}catch(e){throw et(1,e),e}}withInterpreterPgo(e,t){try{return Ee(Fe,{interpreterPgo:e,interpreterPgoSaveDelay:t}),Fe.runtimeOptions?Fe.runtimeOptions.push("--interp-pgo-recording"):Fe.runtimeOptions=["--interp-pgo-recording"],this}catch(e){throw et(1,e),e}}withConfig(e){try{return Ee(Fe,e),this}catch(e){throw et(1,e),e}}withConfigSrc(e){try{return e&&"string"==typeof e||qe(!1,"must be file path or URL"),Te(Be,{configSrc:e}),this}catch(e){throw et(1,e),e}}withVirtualWorkingDirectory(e){try{return e&&"string"==typeof e||qe(!1,"must be directory path"),Ee(Fe,{virtualWorkingDirectory:e}),this}catch(e){throw et(1,e),e}}withEnvironmentVariable(e,t){try{const o={};return o[e]=t,Ee(Fe,{environmentVariables:o}),this}catch(e){throw et(1,e),e}}withEnvironmentVariables(e){try{return e&&"object"==typeof e||qe(!1,"must be dictionary object"),Ee(Fe,{environmentVariables:e}),this}catch(e){throw et(1,e),e}}withDiagnosticTracing(e){try{return"boolean"!=typeof e&&qe(!1,"must be boolean"),Ee(Fe,{diagnosticTracing:e}),this}catch(e){throw et(1,e),e}}withDebugging(e){try{return null!=e&&"number"==typeof e||qe(!1,"must be number"),Ee(Fe,{debugLevel:e}),this}catch(e){throw et(1,e),e}}withApplicationArguments(...e){try{return e&&Array.isArray(e)||qe(!1,"must be array of strings"),Ee(Fe,{applicationArguments:e}),this}catch(e){throw et(1,e),e}}withRuntimeOptions(e){try{return e&&Array.isArray(e)||qe(!1,"must be array of strings"),Fe.runtimeOptions?Fe.runtimeOptions.push(...e):Fe.runtimeOptions=e,this}catch(e){throw et(1,e),e}}withMainAssembly(e){try{return Ee(Fe,{mainAssemblyName:e}),this}catch(e){throw et(1,e),e}}withApplicationArgumentsFromQuery(){try{if(!globalThis.window)throw new Error("Missing window to the query parameters from");if(void 0===globalThis.URLSearchParams)throw new Error("URLSearchParams is supported");const e=new URLSearchParams(globalThis.window.location.search).getAll("arg");return this.withApplicationArguments(...e)}catch(e){throw et(1,e),e}}withApplicationEnvironment(e){try{return Ee(Fe,{applicationEnvironment:e}),this}catch(e){throw et(1,e),e}}withApplicationCulture(e){try{return Ee(Fe,{applicationCulture:e}),this}catch(e){throw et(1,e),e}}withResourceLoader(e){try{return Ne.loadBootResource=e,this}catch(e){throw et(1,e),e}}async download(){try{await async function(){dt(Be),await Se(Be),se(),k(),re(),await Ne.allDownloadsFinished.promise}()}catch(e){throw et(1,e),e}}async create(){try{return this.instance||(this.instance=await async function(){return await ut(Be),Ve.api}()),this.instance}catch(e){throw et(1,e),e}}async run(){try{return Be.config||qe(!1,"Null moduleConfig.config"),this.instance||await this.create(),this.instance.runMainAndExit()}catch(e){throw et(1,e),e}}},pt=et,ht=ut;Me||"function"==typeof globalThis.URL||qe(!1,"This browser/engine doesn't support URL API. Please use a modern version. See also https://aka.ms/dotnet-wasm-features"),"function"!=typeof globalThis.BigInt64Array&&qe(!1,"This browser/engine doesn't support BigInt64Array API. Please use a modern version. See also https://aka.ms/dotnet-wasm-features"),(Me||De)&&qe(!1,"This build of dotnet is multi-threaded, it doesn't support shell environments like V8 or NodeJS. See also https://aka.ms/dotnet-wasm-features"),void 0===globalThis.SharedArrayBuffer&&qe(!1,"SharedArrayBuffer is not enabled on this page. Please use a modern browser and set Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy http headers. See also https://aka.ms/dotnet-wasm-features"),"function"!=typeof globalThis.EventTarget&&qe(!1,"This browser/engine doesn't support EventTarget API. Please use a modern version. See also https://aka.ms/dotnet-wasm-features"),gt.withConfig(/*json-start*/{
  "mainAssemblyName": "TerrariaWebLoader",
  "resources": {
    "hash": "sha256-QdmasiyPnbOmS+ogqvHAZebHHib1jNfj7JPUNCMOlkQ=",
    "jsModuleWorker": [
      {
        "name": "dotnet.native.worker.7hlzjx50fa.mjs"
      }
    ],
    "jsModuleNative": [
      {
        "name": "dotnet.native.moch2hpu2a.js"
      }
    ],
    "jsModuleRuntime": [
      {
        "name": "dotnet.runtime.ncwn8rd524.js"
      }
    ],
    "wasmNative": [
      {
        "name": "dotnet.native.r04ftwp9g6.wasm",
        "hash": "sha256-G09Hw8TdTb9c06/qenc4qf5yBDH1ljXcqvJajZj6ZyY=",
        "cache": "force-cache"
      }
    ],
    "icu": [
      {
        "virtualPath": "icudt_CJK.dat",
        "name": "icudt_CJK.tjcz0u77k5.dat",
        "hash": "sha256-SZLtQnRc0JkwqHab0VUVP7T3uBPSeYzxzDnpxPpUnHk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "icudt_EFIGS.dat",
        "name": "icudt_EFIGS.tptq2av103.dat",
        "hash": "sha256-8fItetYY8kQ0ww6oxwTLiT3oXlBwHKumbeP2pRF4yTc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "icudt_no_CJK.dat",
        "name": "icudt_no_CJK.lfu7j35m59.dat",
        "hash": "sha256-L7sV7NEYP37/Qr2FPCePo5cJqRgTXRwGHuwF5Q+0Nfs=",
        "cache": "force-cache"
      }
    ],
    "coreAssembly": [
      {
        "virtualPath": "System.Collections.Concurrent.wasm",
        "name": "System.Collections.Concurrent.fc3mxjmebx.wasm",
        "hash": "sha256-b4dJkMAgwkMJWi4Yd/ofVdnRNXNevZX61FY2D45P0d4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Collections.wasm",
        "name": "System.Collections.w3scdaqovs.wasm",
        "hash": "sha256-tLFiIL5l4C3pJwb97joY75Gxh03EwsOItXelrQseY/M=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Private.CoreLib.wasm",
        "name": "System.Private.CoreLib.spmpaui14s.wasm",
        "hash": "sha256-QCFj77pfDp8SBYPcpCfleyb96dtX/ClkGs4tcD1XS4g=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.InteropServices.JavaScript.wasm",
        "name": "System.Runtime.InteropServices.JavaScript.iyz8hfqk14.wasm",
        "hash": "sha256-ClWPcnf1N8B4nORVwgLwVniL3FqcAOhU5Ut0zuD/6Eo=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.wasm",
        "name": "System.Threading.8xs9izgbv1.wasm",
        "hash": "sha256-rHhZD3yOzbAbIcYtv0oELNdKXNO0FOcr5grDXVlTdto=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Channels.wasm",
        "name": "System.Threading.Channels.u6jwukaw3f.wasm",
        "hash": "sha256-Jne6pgqcxVFzTiSk60AEE8IVfTENjq6MZmqfQo4U33U=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.ThreadPool.wasm",
        "name": "System.Threading.ThreadPool.vh0rz75zye.wasm",
        "hash": "sha256-vTXpiUYR/7XjttXI8rGzogxXGvLI7mfWkEy1OICDmMU=",
        "cache": "force-cache"
      }
    ],
    "assembly": [
      {
        "virtualPath": "FNA.wasm",
        "name": "FNA.9swyxerhhs.wasm",
        "hash": "sha256-eYMlDbA6UmUKucoU9qc9G0954gOaMZMmbIH+yZGBYNY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Microsoft.CSharp.wasm",
        "name": "Microsoft.CSharp.45w5ndn4gy.wasm",
        "hash": "sha256-CJO4puZQbLLb+i3QGsd51GFtATovrIDozBWmTN9Sbww=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Microsoft.VisualBasic.wasm",
        "name": "Microsoft.VisualBasic.6b1p6yq8b3.wasm",
        "hash": "sha256-Hv8ZRxbClXSNk2ZZyrkuhKDRNRXDTC8Fg4yRDw+54tU=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Microsoft.VisualBasic.Core.wasm",
        "name": "Microsoft.VisualBasic.Core.4day4tivbb.wasm",
        "hash": "sha256-+GDjCt31o1YroG/ZOYRmPfXKUrqf6t8e3IjiSfywXF0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Microsoft.Win32.Primitives.wasm",
        "name": "Microsoft.Win32.Primitives.keckrjyc2q.wasm",
        "hash": "sha256-zMKhb4bBHXEqaOHAWQqNzHZ7IX/fJA2Ft7zyg3956AY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Microsoft.Win32.Registry.wasm",
        "name": "Microsoft.Win32.Registry.o7q57g4y3v.wasm",
        "hash": "sha256-DIVOkoMzTivoyDep6VBAq2pkm0XLAHjgsZ8c0hVgR4g=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Mono.Cecil.Mdb.wasm",
        "name": "Mono.Cecil.Mdb.429tb82tx1.wasm",
        "hash": "sha256-5MFrAshP4u3t9BrLEnpT4v3lcXoWj0avnxo3PkMoVaI=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Mono.Cecil.Pdb.wasm",
        "name": "Mono.Cecil.Pdb.b129czsraf.wasm",
        "hash": "sha256-j+oaBhb0AS0BXkKoBnT8JlXEYkQsFu+tDz1ie6MVess=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Mono.Cecil.Rocks.wasm",
        "name": "Mono.Cecil.Rocks.9i3lw3h19g.wasm",
        "hash": "sha256-/551Wf0QfYmHbR/t178FbPNJ2IrjMIVQC6RUE77W/lY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "Mono.Cecil.wasm",
        "name": "Mono.Cecil.danupkle3u.wasm",
        "hash": "sha256-ZSpqLykYee8D52LatgELxnJL5ka2lVtt77MkdTE6wpk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.AppContext.wasm",
        "name": "System.AppContext.7pfnw66j8s.wasm",
        "hash": "sha256-O8d1FWlo24sTjnDw1s+Rno7O2oAVGNxDlabBtwKadqI=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Buffers.wasm",
        "name": "System.Buffers.n9eydi1g7o.wasm",
        "hash": "sha256-u0E/FZ0QaqggBQAbctPb4hcC/lsHKd+wrUEeO5rhSTM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Collections.Immutable.wasm",
        "name": "System.Collections.Immutable.5srny90eq0.wasm",
        "hash": "sha256-ZZJJiXUl290EW+DDZap4ZwkR5x8IKWL6spyz2S9llSM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Collections.NonGeneric.wasm",
        "name": "System.Collections.NonGeneric.0gs0za6wta.wasm",
        "hash": "sha256-AFuTDkYfbV8ocUWG5zwDCi0NdwW5P/cB6WRl3OyGJt4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Collections.Specialized.wasm",
        "name": "System.Collections.Specialized.0lamnc2eez.wasm",
        "hash": "sha256-FKbs0tmJZIVN88hOXSjJ43D4UR2I4X4ZiUvdVIcHRTQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ComponentModel.wasm",
        "name": "System.ComponentModel.2dg08nsbgq.wasm",
        "hash": "sha256-KmnDHVuWvpbi29hLLrci8zQBJF48PBi0SfpJ1rNbUWw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ComponentModel.Annotations.wasm",
        "name": "System.ComponentModel.Annotations.qqu4bynrpj.wasm",
        "hash": "sha256-XqiYhw5tM0rAN1HKRelBvceGlZhipGBMC3klriI2XBw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ComponentModel.DataAnnotations.wasm",
        "name": "System.ComponentModel.DataAnnotations.6ljk5kma3w.wasm",
        "hash": "sha256-KnUQKz5ZSjpa7ALHN8B7sH1nsx2EWEqE3JO9j86qRPc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ComponentModel.EventBasedAsync.wasm",
        "name": "System.ComponentModel.EventBasedAsync.0necwturs4.wasm",
        "hash": "sha256-HClyl5kQNCJxuOlMRFX/hlk7a0KNvikoOSf8UDhznfk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ComponentModel.Primitives.wasm",
        "name": "System.ComponentModel.Primitives.ex1da4zowy.wasm",
        "hash": "sha256-/qr+OeVTHM3ta9ZSsOy9Hdx6NgDj7okJFBHbsROuZIk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ComponentModel.TypeConverter.wasm",
        "name": "System.ComponentModel.TypeConverter.t0513robn6.wasm",
        "hash": "sha256-U8HtpNa1FMiBzuj2xwI8pqolMEwlYMKic1fVkSt+nvo=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Configuration.wasm",
        "name": "System.Configuration.11exwmwngo.wasm",
        "hash": "sha256-Rb2vWhUfjYc+Tz1jkksLjkcRqo5Toaa0m7r4ciygeFE=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Console.wasm",
        "name": "System.Console.4o049fyksq.wasm",
        "hash": "sha256-nL6VsOcQEnqdxvsBbYnjGYv1YC6HZ7T+Mxjed8wuQYQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Core.wasm",
        "name": "System.Core.qrb0ji5we6.wasm",
        "hash": "sha256-lgZAZx2o1Ytdxs3MSetWFGtmLpq3gluOPInXKa43Av4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Data.Common.wasm",
        "name": "System.Data.Common.5apdqcwjmv.wasm",
        "hash": "sha256-w3Qplnyv+vysRDs8UTCz3LZ4Y5AqWO5A8tQaTWs4YDQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Data.DataSetExtensions.wasm",
        "name": "System.Data.DataSetExtensions.ndyqwckzh5.wasm",
        "hash": "sha256-iwBcpnHFIko2zI/K7pfr2fyci0Sk9DEhHA4nm2dgXvQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Data.wasm",
        "name": "System.Data.z5drm96cnj.wasm",
        "hash": "sha256-Z3XPswzUJCMc42AyTAvEYC/3d+cfS7acLw2P6WJzpHk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.Contracts.wasm",
        "name": "System.Diagnostics.Contracts.gkzwiqmp5z.wasm",
        "hash": "sha256-8OklcFg2hXfBVGvbmB2N3Yav3Sm52C10vEdVXLejw84=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.Debug.wasm",
        "name": "System.Diagnostics.Debug.faxnhsagf6.wasm",
        "hash": "sha256-ubbfKY2Pxouux+zzDvQAlaCBC0QDPcIoXm5NlOrKwMs=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.DiagnosticSource.wasm",
        "name": "System.Diagnostics.DiagnosticSource.o8neuaehsr.wasm",
        "hash": "sha256-2Cwth9SwX3nN7VkeyJfnWu+f1ck6XsA0u3a4xnwhHdg=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.FileVersionInfo.wasm",
        "name": "System.Diagnostics.FileVersionInfo.3veftfofsy.wasm",
        "hash": "sha256-/xEFkwN21BFR7y5cPXnNtwAt+z95I7s79crzwz4wHOM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.Process.wasm",
        "name": "System.Diagnostics.Process.m02d4wsk19.wasm",
        "hash": "sha256-ivDTOwBc85my2YMQGqvXibdZ/ObVNySrF+QlffJ181c=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.StackTrace.wasm",
        "name": "System.Diagnostics.StackTrace.h8t3uz1gsf.wasm",
        "hash": "sha256-P+8sBuFvL4Pk07da3D1ILb50OcQXMHA8tfLUuoWI33g=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.TextWriterTraceListener.wasm",
        "name": "System.Diagnostics.TextWriterTraceListener.eytcvy9k8s.wasm",
        "hash": "sha256-pvnJZlyHHocCwxPHKv9W2GePoq7vXVi9vSKJW117sMw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.Tools.wasm",
        "name": "System.Diagnostics.Tools.fj2fven09q.wasm",
        "hash": "sha256-ZV7aPJQIni/ZoO2oNwJ9Of3IeCEkAn8ey14WJzBvOrI=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.TraceSource.wasm",
        "name": "System.Diagnostics.TraceSource.snxq0zroas.wasm",
        "hash": "sha256-GLdxnuHLTVm2fFereUadrP2eMHDIIuh+qwLtU6bieAo=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Diagnostics.Tracing.wasm",
        "name": "System.Diagnostics.Tracing.5dvohqj9dm.wasm",
        "hash": "sha256-N4LiIhYOMTzka5js5eoyB+3k6R0xQaW/Hk/AXIcVw+4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Drawing.Primitives.wasm",
        "name": "System.Drawing.Primitives.qihgks5s1u.wasm",
        "hash": "sha256-Tm9mqTsBeK3LprUlVf4WZeXVyfKV7eeLsfiKjOfNFzA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Drawing.wasm",
        "name": "System.Drawing.yh4pswp3to.wasm",
        "hash": "sha256-Bk+UbNg1tcBriLXo07qvobZSEv6j90GEZTC5wV6Dl6g=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Dynamic.Runtime.wasm",
        "name": "System.Dynamic.Runtime.qf4wa78w3a.wasm",
        "hash": "sha256-diQ9uxKq9xQ2DNa7Gt/z6sQdAZAo1FcG+ah3+guLSTM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Formats.Asn1.wasm",
        "name": "System.Formats.Asn1.ei47lr61p0.wasm",
        "hash": "sha256-ljNg+qOWoKxPDuH7ak3oGVyKvIciz8tePzTI+M+izEQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Formats.Tar.wasm",
        "name": "System.Formats.Tar.jt7yo4wxzn.wasm",
        "hash": "sha256-6buezhfeO7mbmfnifZvm6iX+uCRgYheoGlgaPe/XmeM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Globalization.Calendars.wasm",
        "name": "System.Globalization.Calendars.vfqjdvj4bj.wasm",
        "hash": "sha256-m0WDRORBr4o0LZDZdWACvVPTyoH9Ls7B2ZVsCatzh2E=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Globalization.Extensions.wasm",
        "name": "System.Globalization.Extensions.fb3tp0zu2j.wasm",
        "hash": "sha256-Cx8ujdaPRQBQxupdkzsG/8ATMSDf8zqHtczx5SNDm+I=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Globalization.wasm",
        "name": "System.Globalization.jpj90sbpo9.wasm",
        "hash": "sha256-B6wWiZwQw69vsLtM0cqXbd8/6CFl+wa3S7A0yrFKC60=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.Compression.Brotli.wasm",
        "name": "System.IO.Compression.Brotli.fpnvzsxpvo.wasm",
        "hash": "sha256-w8wFL6Rxw/JQFrfu6Qq36zeTmVrqjwi6k+O22FyboLc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.Compression.FileSystem.wasm",
        "name": "System.IO.Compression.FileSystem.tk5twcs8br.wasm",
        "hash": "sha256-fVEnLzs+x6Mu8bc+aT/JB1NwVmXMUPmKVqPn9glwzTE=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.Compression.ZipFile.wasm",
        "name": "System.IO.Compression.ZipFile.f6odqd84z5.wasm",
        "hash": "sha256-WRYZWdNKeTW4O8hYtYnTTMF63lkSE3ZY7j18oexLCQw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.Compression.wasm",
        "name": "System.IO.Compression.zo5nnp1cfl.wasm",
        "hash": "sha256-bfjaVDeZimD1r9F7TAtxRdlBcd0rDdG+1u8NdiB0Bi0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.FileSystem.wasm",
        "name": "System.IO.FileSystem.4xxxdm8fc4.wasm",
        "hash": "sha256-+K4ZEP9Hf7s4t6Gmid21VdWrn3texZ4YP7fHrrrL4Hc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.FileSystem.AccessControl.wasm",
        "name": "System.IO.FileSystem.AccessControl.3nsp4r0ce1.wasm",
        "hash": "sha256-Py0llo4NrZMEBxbvfZc4K9alUXvQ48bXB/pSDfJV1ic=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.FileSystem.DriveInfo.wasm",
        "name": "System.IO.FileSystem.DriveInfo.2dz9a3mpco.wasm",
        "hash": "sha256-RvFSUxpWtaEjS5BbVGAGCjp2x0qU9XXmREhIu30VoPw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.FileSystem.Primitives.wasm",
        "name": "System.IO.FileSystem.Primitives.ts09gphu65.wasm",
        "hash": "sha256-s+/PB1XFmGKtSJOtS2aNXasRTzVhrmMtHqdHnmXCIYA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.FileSystem.Watcher.wasm",
        "name": "System.IO.FileSystem.Watcher.zra8jhxo53.wasm",
        "hash": "sha256-j8+JoCeJbxEO78Lh52qGvZH2U3p0iv3C7Mf70A0REKE=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.IsolatedStorage.wasm",
        "name": "System.IO.IsolatedStorage.czh3ilflkw.wasm",
        "hash": "sha256-OIwfDmiURUWHrnlOIQqT/qojyJMgZLaK125mCis9T7E=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.MemoryMappedFiles.wasm",
        "name": "System.IO.MemoryMappedFiles.f0h74bif4r.wasm",
        "hash": "sha256-38FFWbMQLN09EVXsfMGYmZ21sxQ5qvzRd13/o5AV0Kc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.Pipelines.wasm",
        "name": "System.IO.Pipelines.eqtd8a5j6e.wasm",
        "hash": "sha256-OqgWW+yNK3GNknzwunup+y4wFUQWTWIgKleNPjAQ2FA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.Pipes.AccessControl.wasm",
        "name": "System.IO.Pipes.AccessControl.cz75e7snno.wasm",
        "hash": "sha256-qIEpbJrizv5PV8Aw8M0ToDhK56glGd0AY9Yv6rCHeis=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.Pipes.wasm",
        "name": "System.IO.Pipes.amk3gre8pn.wasm",
        "hash": "sha256-IseVko52Xa5QwmMvJk794jAywCJfz/astKoHWFVUNDY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.UnmanagedMemoryStream.wasm",
        "name": "System.IO.UnmanagedMemoryStream.pjda8c8goj.wasm",
        "hash": "sha256-FZtEnO8jTeEVDqVFzkgtra3P+0fMzE5gA4hA6xvoekw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.IO.wasm",
        "name": "System.IO.hvb68vhf4w.wasm",
        "hash": "sha256-Y8pKI5kBw7qVF6tIxccOKy8vmDuPXJbGIV/7dO+5DUI=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Linq.AsyncEnumerable.wasm",
        "name": "System.Linq.AsyncEnumerable.p5kf8px69a.wasm",
        "hash": "sha256-za8JzxTeYsgXKmTR8f1UCwUO3xp1GHO1dfHG2rkvFx0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Linq.Expressions.wasm",
        "name": "System.Linq.Expressions.rrm2f8e4yg.wasm",
        "hash": "sha256-x071I76a5oMKdr4Lr5qaUIznyjGsWHa7gNx9HXd7XKs=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Linq.Parallel.wasm",
        "name": "System.Linq.Parallel.863hkxogoi.wasm",
        "hash": "sha256-UGL5z+jZB8VBsoNb24yxe/kJ6pfplx2KawSq3vZvoCQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Linq.Queryable.wasm",
        "name": "System.Linq.Queryable.trhrf5j8ds.wasm",
        "hash": "sha256-uWXWvl6HRLIBq4FC8RxXqvCpUIECCIDB7HCfuWVMM4w=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Linq.wasm",
        "name": "System.Linq.gvekllsg4c.wasm",
        "hash": "sha256-TPHlJKw/gIh+TH1yPCn1S2dq12MlyEcuy70GRlKIHVc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Memory.wasm",
        "name": "System.Memory.tul2flg4kd.wasm",
        "hash": "sha256-Jb4TRPBP9Ct+sQSDCJxzITyR3CEpUglcyLABJGOMzJ0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Http.wasm",
        "name": "System.Net.Http.13xfi6yzh2.wasm",
        "hash": "sha256-PV/UNmtYhbEBWKGXO2nqjXXM25qnOtOKXY4GLJGaPV4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Http.Json.wasm",
        "name": "System.Net.Http.Json.cnwprpsgic.wasm",
        "hash": "sha256-iDDM7WcrEPUJwxcYZ2i2kkX7ycNpXrhwuageMaHfoIY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.HttpListener.wasm",
        "name": "System.Net.HttpListener.ij8kltpk25.wasm",
        "hash": "sha256-wj4HzkR3Vov1aHzI+B8uuc6AZmc5h1arllB2cfg6NZQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Mail.wasm",
        "name": "System.Net.Mail.z8qhziwoem.wasm",
        "hash": "sha256-3dWE+vwj3Eb9XspAa28O22/Cr4NygP1QsnYyfIZ6Qe4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.NameResolution.wasm",
        "name": "System.Net.NameResolution.ncmdi0kq9p.wasm",
        "hash": "sha256-mTtcnOFzYzSMXXd2a174unzZ6b+EkPVL8pXWAMAxj10=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.NetworkInformation.wasm",
        "name": "System.Net.NetworkInformation.es6jl8uhrp.wasm",
        "hash": "sha256-4uENkymMPouhb8Ks/rwxTJ4yrQfSi5mkka0fIVeV8hY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Ping.wasm",
        "name": "System.Net.Ping.leo6kko976.wasm",
        "hash": "sha256-DeVi23sQNfBxhjRQ9+h1iSsXBbppbMEe41k92kiJT8k=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Primitives.wasm",
        "name": "System.Net.Primitives.yzzu57r5h4.wasm",
        "hash": "sha256-vqLfrWLCm79hqbNFUrtrKDVsxs42xW6WwFhjnD7io/w=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Quic.wasm",
        "name": "System.Net.Quic.t4x9xorc7c.wasm",
        "hash": "sha256-Ax9TZmgLakuQz47SztXRNTkbGUKhQj6ZHr7d/XtHlAo=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Requests.wasm",
        "name": "System.Net.Requests.hvrao969rw.wasm",
        "hash": "sha256-nSdkARDHjDwE2k8vBwWJ/2hXgEMW+RdlzFnTBeRa6dw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Security.wasm",
        "name": "System.Net.Security.z570hyrh50.wasm",
        "hash": "sha256-uXJUWASEVCLGuQaC75WF/wfKJDlLxKvK+qiquIQUdv8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.ServerSentEvents.wasm",
        "name": "System.Net.ServerSentEvents.b3gkat9xqz.wasm",
        "hash": "sha256-icPYYEtWXdi1rBjc05tz8xHIHiC41c29PDpwTJWFFfM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.ServicePoint.wasm",
        "name": "System.Net.ServicePoint.k1tgr3lkj6.wasm",
        "hash": "sha256-CC70+qY9saZpIjtriScppCbxAXxhqBQBZ9mpNfZcq9U=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.Sockets.wasm",
        "name": "System.Net.Sockets.fgcxent7fc.wasm",
        "hash": "sha256-sShFVrPuzu2M7hUvGfamsyx9NasDH2SkuWloy++E/5A=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.WebClient.wasm",
        "name": "System.Net.WebClient.kpwi6t40sc.wasm",
        "hash": "sha256-GBCEQdqP1NxDzSmkLUkcJ+I5YeAYhxTOQd7/peETsDQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.WebHeaderCollection.wasm",
        "name": "System.Net.WebHeaderCollection.fnxrdiu9j1.wasm",
        "hash": "sha256-G7irCBdrHUh42dVzJinnMM2GPS4ORY3hkUzXGq/MeoY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.WebProxy.wasm",
        "name": "System.Net.WebProxy.wtgabypaqs.wasm",
        "hash": "sha256-TMnTewBGBJnTjfTMG7SpQI+gmW6c3vUkStZFtVDNh7I=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.WebSockets.wasm",
        "name": "System.Net.WebSockets.4zomq83cjx.wasm",
        "hash": "sha256-EC4hrPAlfJvREV3XTzbwzxhE6hhy7PPnj0ry2QOIeMk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.WebSockets.Client.wasm",
        "name": "System.Net.WebSockets.Client.u56qzzrvuu.wasm",
        "hash": "sha256-soD+8ocKUgoODSjofjuxe2CQg5868p+StnkiQo5KF7s=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Net.wasm",
        "name": "System.Net.plchg2cs85.wasm",
        "hash": "sha256-84000+CExy/aHGGC9P0RZE2SLfp7Tv24OAm2u266SHk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Numerics.wasm",
        "name": "System.Numerics.7xa3ygjnjn.wasm",
        "hash": "sha256-9RP3PUZYzQWz1YfV3GNEUNPSgRypKxLgBl0RHw+3/gg=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Numerics.Vectors.wasm",
        "name": "System.Numerics.Vectors.j2k4vpazdu.wasm",
        "hash": "sha256-Zd4J5Cvwmwm1OAjyxI90ylsdeqlxxr4Zb2Te6NsBPNk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ObjectModel.wasm",
        "name": "System.ObjectModel.0us7g9291u.wasm",
        "hash": "sha256-uMHmaTPiBz1NlbeXHOlJ0q7nyqzYWiIiYSANEjaOYwU=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Private.DataContractSerialization.wasm",
        "name": "System.Private.DataContractSerialization.45rz0h7hbh.wasm",
        "hash": "sha256-KAjJhYDEAJ94UN3omOH42BoV5Cfd6xIgMzhN1IoMElI=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Private.Uri.wasm",
        "name": "System.Private.Uri.qjtc4pvsn8.wasm",
        "hash": "sha256-ametGeVzgEWhFAMrqzjhyXUFn6QFsp2Txj60L7/gKok=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Private.Xml.Linq.wasm",
        "name": "System.Private.Xml.Linq.91dmao781k.wasm",
        "hash": "sha256-fQX8G3Lk0Wwz8T58/YWm9akvXCyjQ8j3jUQl0q+lDQo=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Private.Xml.wasm",
        "name": "System.Private.Xml.ihpa1sp5u8.wasm",
        "hash": "sha256-hgCZUxcb4m9i6rV34zw1Atgt3HSp1vJ8a00H6mMA5Jg=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.DispatchProxy.wasm",
        "name": "System.Reflection.DispatchProxy.dotf7d6gov.wasm",
        "hash": "sha256-A6GkiiuQDSGWUNIiiMseu2L+shj+93iNqmrq0OI38U0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.Emit.wasm",
        "name": "System.Reflection.Emit.7sf4twlt2l.wasm",
        "hash": "sha256-GYoh5JmBKBaoCW4ANzA45CYZ5yLR4xcN/5ROvRxvdMA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.Emit.ILGeneration.wasm",
        "name": "System.Reflection.Emit.ILGeneration.yjs6lwxt88.wasm",
        "hash": "sha256-8iSGG5ZzrPvocgML6gXAQkJrhOPOfQltxaKKkYYOh7k=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.Emit.Lightweight.wasm",
        "name": "System.Reflection.Emit.Lightweight.d4djcgbaqo.wasm",
        "hash": "sha256-0zpGyQIaMGWumeRhtvRugI55ORUj431qKDSrLt+82/4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.Extensions.wasm",
        "name": "System.Reflection.Extensions.0ouvp5b0xg.wasm",
        "hash": "sha256-ALYcmeW3kw6IcHxGFJQsD2npG9CsrdDnKNPiGfETelM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.Metadata.wasm",
        "name": "System.Reflection.Metadata.vkm0bf1n4h.wasm",
        "hash": "sha256-sTbHkzvGLaXk8+NK1v6odvXMen5H0157fGQFWSf8aPY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.Primitives.wasm",
        "name": "System.Reflection.Primitives.lpdb18akjn.wasm",
        "hash": "sha256-14TmYdCH6J73R6BlbbIyminc6m6fC9PhJOwVbhbPMb8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.TypeExtensions.wasm",
        "name": "System.Reflection.TypeExtensions.c57npbrh2y.wasm",
        "hash": "sha256-8DhZMIcSnuEYBJiro2ClWkJs3tApu4emBUtuYpDu3Ak=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Reflection.wasm",
        "name": "System.Reflection.qdi0svky7b.wasm",
        "hash": "sha256-DpWMJNQ3vBseMhYXxp3aFaupTQ4Tt0HDmlFBCNq4eVg=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Resources.Reader.wasm",
        "name": "System.Resources.Reader.tkyk3pewoj.wasm",
        "hash": "sha256-80z76z8557+n0NiS4/3P7acn4mmypiLXTKRV1BrXQLM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Resources.ResourceManager.wasm",
        "name": "System.Resources.ResourceManager.mxgnwpq6s6.wasm",
        "hash": "sha256-evkvukYhbWFIWaZGbGoBPpNqUQ1JKv+27nQXnSNiCZg=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Resources.Writer.wasm",
        "name": "System.Resources.Writer.u12ln0bq25.wasm",
        "hash": "sha256-oqRq2ovlZZx4e02gSUKY2g/8JGegsCp+q2BNylxTKGY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.CompilerServices.Unsafe.wasm",
        "name": "System.Runtime.CompilerServices.Unsafe.mvjra26big.wasm",
        "hash": "sha256-Yk9CihyP/VJKpHztVAkDc9DziRYrbfsAaJND8qOsWAM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.CompilerServices.VisualC.wasm",
        "name": "System.Runtime.CompilerServices.VisualC.0zws5y4za8.wasm",
        "hash": "sha256-7ILX42abpBFW9NcNlL8wxH3SiCnPXeRZHxi86AlD0aA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Extensions.wasm",
        "name": "System.Runtime.Extensions.53v9tmujmf.wasm",
        "hash": "sha256-XwXT8plE1a3JpkSjfhgY7cXLn0RQ/h7Yi2ALDYS9oiY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Handles.wasm",
        "name": "System.Runtime.Handles.dtp1f2k1pr.wasm",
        "hash": "sha256-8W/nPji7gKtrJkhq0ZPYdmJUE4usBSTyhhlZx4NMvuE=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.InteropServices.RuntimeInformation.wasm",
        "name": "System.Runtime.InteropServices.RuntimeInformation.5dmsm0qrdq.wasm",
        "hash": "sha256-x2lqh4H7xYj6Emlp8KiwcDw98RgennI2MdWngWY2xAY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.InteropServices.wasm",
        "name": "System.Runtime.InteropServices.geo2nynhgs.wasm",
        "hash": "sha256-CNdFmlLDqjRhlCKPuWAFChn4VUO5Bl2HcqBa+YY4xbo=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Intrinsics.wasm",
        "name": "System.Runtime.Intrinsics.epcqmvg4gt.wasm",
        "hash": "sha256-LosBv1F1Hu/3ATrdt6rBh89F96n90/1EPE/+yn0qi8M=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Loader.wasm",
        "name": "System.Runtime.Loader.yu4e9fdiar.wasm",
        "hash": "sha256-GqVaz78LCgZU3i4BS2TXo6wf5PMv4uQToy+RbevwMdU=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Numerics.wasm",
        "name": "System.Runtime.Numerics.hnmfmtcdek.wasm",
        "hash": "sha256-k3UA6eMQNB2rruFfXB857MwCFNBVuEaVFUftGfY1ZZ0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Serialization.wasm",
        "name": "System.Runtime.Serialization.890gxgs7km.wasm",
        "hash": "sha256-tBkX+cE/iReBsrq7VBuNAfg5SlHy6TI5IuuUooFqLV0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Serialization.Formatters.wasm",
        "name": "System.Runtime.Serialization.Formatters.99nio8ut31.wasm",
        "hash": "sha256-PZ6RBgnBF4AJsX+NVgLThyON5CewffgbYgEkSe4sUAo=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Serialization.Json.wasm",
        "name": "System.Runtime.Serialization.Json.rmpm3bs9gf.wasm",
        "hash": "sha256-veVLT5Vjcs7ZLV7+4sNzFDQ5aFBecUarJpouN3Gns40=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Serialization.Primitives.wasm",
        "name": "System.Runtime.Serialization.Primitives.rhltpkb1qn.wasm",
        "hash": "sha256-D4uU7llKn8xchQYHLhOn1Qc10C30St9eNKUz4+ONmps=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.Serialization.Xml.wasm",
        "name": "System.Runtime.Serialization.Xml.2qu958brox.wasm",
        "hash": "sha256-NkchR8EWanClciz3k/qau+G6uTUnJBl5YHhl3wovWL4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Runtime.wasm",
        "name": "System.Runtime.qt8x8glrr7.wasm",
        "hash": "sha256-Ev28ggeDF8SpEixRy80jmstewfXU5iyuGZ1qUzcfZt0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.AccessControl.wasm",
        "name": "System.Security.AccessControl.frpe4iqtxg.wasm",
        "hash": "sha256-62X2KGoHlo0SwLjlMwtsnfoxTdIk6HegxK6oLngCh4U=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Claims.wasm",
        "name": "System.Security.Claims.1iu8vf654n.wasm",
        "hash": "sha256-l/gtyIiZOP3M5OCb6iV+nBtJ2ZHZRYg2h5FQRE5bi3A=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.Algorithms.wasm",
        "name": "System.Security.Cryptography.Algorithms.667n7jcyg1.wasm",
        "hash": "sha256-8qjk1F+fKWe1G1i7hTGeiFLTozPbr5zSOGyksAZS43M=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.Cng.wasm",
        "name": "System.Security.Cryptography.Cng.bd7h0b8iov.wasm",
        "hash": "sha256-j0ue2FrsiiVk6+jX2KTRFQu0byrqhRczwmFm+t25D9c=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.Csp.wasm",
        "name": "System.Security.Cryptography.Csp.z1odikd5x2.wasm",
        "hash": "sha256-+RJATQZ2BXDfWlLde2TorzEl3W9FK9iTj67FKfPgI2Y=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.Encoding.wasm",
        "name": "System.Security.Cryptography.Encoding.o0gt2d4ysx.wasm",
        "hash": "sha256-qLM827pQ5WnFKssP5y4XrU4njBIJvMM41BAl44BxvGM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.OpenSsl.wasm",
        "name": "System.Security.Cryptography.OpenSsl.90bbqu9909.wasm",
        "hash": "sha256-h5Fih674vfe7H7h/3x5k3ItxUijBKTGcxBsX5k3FsT4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.Primitives.wasm",
        "name": "System.Security.Cryptography.Primitives.wc69ogz8hc.wasm",
        "hash": "sha256-kO+lmtijZZCMGK/5LoYzbrNGkU7eMbxR4wCKo5TGas0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.X509Certificates.wasm",
        "name": "System.Security.Cryptography.X509Certificates.zdajb5d4ry.wasm",
        "hash": "sha256-qVWDly2zxpjpKfHp0L/VJowgJHs5/+vg5DXO1pHgEGk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Cryptography.wasm",
        "name": "System.Security.Cryptography.isqs0vklct.wasm",
        "hash": "sha256-Xi05DK42DffxoiT4Zs1GSPiWoCvdjci23Zf0A2o0NKY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Principal.wasm",
        "name": "System.Security.Principal.8kc2gzptia.wasm",
        "hash": "sha256-GPhvgr3DQnFsT00c6VzvWfKVFsGPSxB+IOT7IoO/PKM=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.Principal.Windows.wasm",
        "name": "System.Security.Principal.Windows.lvinz1flf3.wasm",
        "hash": "sha256-r2lrxBx4f52HrlW0vFeZseOECD1hA0B3Qka1KD8rX3Y=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.SecureString.wasm",
        "name": "System.Security.SecureString.287gima5tn.wasm",
        "hash": "sha256-ktKZwyihXrRKlyqqAULWKNmzXBpVXV5rKW0U/PHzFzY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Security.wasm",
        "name": "System.Security.zwe9caa7de.wasm",
        "hash": "sha256-wwdkMNdvjRIrc5c3VvXGAclkRNLjA4NPvaIVGqP7EXw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ServiceModel.Web.wasm",
        "name": "System.ServiceModel.Web.eh14pbj71g.wasm",
        "hash": "sha256-fmpknWj0VD/vzYrdJkVVd578N7WYbslhBvFZhwPqokc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ServiceProcess.wasm",
        "name": "System.ServiceProcess.thnl06mz62.wasm",
        "hash": "sha256-z50UlRNQkoChNoEgONFvhCHlztcHiLbJWVFwJC1wJTA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Text.Encoding.CodePages.wasm",
        "name": "System.Text.Encoding.CodePages.r4fb0qucdq.wasm",
        "hash": "sha256-pVbvGbYUVeWGE3/0VPMSAJGJfcxDpEwZpx1+9Imj3fw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Text.Encoding.Extensions.wasm",
        "name": "System.Text.Encoding.Extensions.xjwg0skpmx.wasm",
        "hash": "sha256-M4cuC+izj8TNxqRQbkEJrxS/RYW7YWc11iGhKYgLAiw=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Text.Encoding.wasm",
        "name": "System.Text.Encoding.x8frxl6434.wasm",
        "hash": "sha256-8Rqn+/nppPhrCjSlR45lU9MURh3L5p/ICXrfH51pgIs=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Text.Encodings.Web.wasm",
        "name": "System.Text.Encodings.Web.i5h886ktzy.wasm",
        "hash": "sha256-Kpc3euWbhy6z1p8euVVbpRL1d3CPlR96LvgEApKRHfA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Text.Json.wasm",
        "name": "System.Text.Json.rfs8iutklf.wasm",
        "hash": "sha256-95uVoOdPtPsw+5CnBAeOC5EMbZ0IzZp6t6WJuP3MJO8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Text.RegularExpressions.wasm",
        "name": "System.Text.RegularExpressions.3wwgc8ow33.wasm",
        "hash": "sha256-gzbFTVQTR2thJUaFScmNNcCp5b0NtoKzeVpzUdOOe0w=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.AccessControl.wasm",
        "name": "System.Threading.AccessControl.3jdprnrbz3.wasm",
        "hash": "sha256-Qchy+xjVC8bRXy8secpI6CWw3ojwlZ8TVrAtLfMdwo4=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Overlapped.wasm",
        "name": "System.Threading.Overlapped.fr41yvdbp3.wasm",
        "hash": "sha256-pWPoVCSuSAjW7mq4Ooo+jxlnP0Z7ndU1sFi1nF/51ug=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Tasks.Dataflow.wasm",
        "name": "System.Threading.Tasks.Dataflow.yxumrwtpb9.wasm",
        "hash": "sha256-2i7vZW9BqHOV8/JJNbVX5LBU2ZTiIK5wQBqCBxLNRA8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Tasks.Extensions.wasm",
        "name": "System.Threading.Tasks.Extensions.c9qgjzqtfp.wasm",
        "hash": "sha256-8CffE5SHuGE9O24ScakgxEH/XX/K4rx3QAm1Cj9wOjA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Tasks.Parallel.wasm",
        "name": "System.Threading.Tasks.Parallel.bzjjb0t6bo.wasm",
        "hash": "sha256-GdlCbQhCVAXQwOqGr+XAC964bXYB3a7SrrRYq1eusMY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Tasks.wasm",
        "name": "System.Threading.Tasks.e8zo3kytn9.wasm",
        "hash": "sha256-oiSkjttYudCXpyuD1YBJMDV1Vd7j+L6BGCdILoJ6xUQ=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Thread.wasm",
        "name": "System.Threading.Thread.e5w1h6hp7j.wasm",
        "hash": "sha256-/s0jv7/NmijsBu466MVzgkltFwURjr2WmBs5MgnhQco=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Threading.Timer.wasm",
        "name": "System.Threading.Timer.d0q7n4qone.wasm",
        "hash": "sha256-k9mVmIHddazot07PEwf6HIvyEL04TkT+uE0gNQKiNIY=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Transactions.wasm",
        "name": "System.Transactions.1rh8d3l1yg.wasm",
        "hash": "sha256-3bS/IddfFNks3dRNbVq7iPwvbbq9JOT2ks6KJMQrpa8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Transactions.Local.wasm",
        "name": "System.Transactions.Local.88eb0ckc89.wasm",
        "hash": "sha256-yAzcC3M5FyxY0GtHVDus9erRjG+8UPSD5u7hlz60ECs=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.ValueTuple.wasm",
        "name": "System.ValueTuple.dz9n78v09g.wasm",
        "hash": "sha256-SQk1zzQVoBowKmyvPkBKDIWRvGpa0DnhrUyJLO5m7do=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Web.HttpUtility.wasm",
        "name": "System.Web.HttpUtility.zkk9vwuwmx.wasm",
        "hash": "sha256-c6+rf/vPpuFHmqitYm40cOM0aoCi51dNdm5Bxh6d8kI=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Web.wasm",
        "name": "System.Web.cpb2jt6aj4.wasm",
        "hash": "sha256-wA559Fslq8o4EJwJXfqDpGFvEHEpzgW63JjvCOoKuBk=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Windows.wasm",
        "name": "System.Windows.z1cdp2137j.wasm",
        "hash": "sha256-R0+MA0yHjCh3/Ti/zIGnypHsFPRlBnkk3vJEfzoM6x8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.Linq.wasm",
        "name": "System.Xml.Linq.zfqbqkhg85.wasm",
        "hash": "sha256-YWvItDe2FMfnVMWrQOpYOyB1++/XVoQhhEbOZ1ozBhU=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.ReaderWriter.wasm",
        "name": "System.Xml.ReaderWriter.j5zd7b3r9j.wasm",
        "hash": "sha256-N1ZVlw8IeC1gwLfmYKLtGLEAYyzQvsz2By9FNGGzNTc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.Serialization.wasm",
        "name": "System.Xml.Serialization.g3ffx007q0.wasm",
        "hash": "sha256-1IQJ8ugyidiig+DaxOFfbaq6fQ2fHvDtBjJHn8tnD+o=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.XDocument.wasm",
        "name": "System.Xml.XDocument.d9vqmjsh7t.wasm",
        "hash": "sha256-wSJkdH1gmbcGOuLsxUCEilcNM2IP319IFdNN7YXJvI8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.XPath.XDocument.wasm",
        "name": "System.Xml.XPath.XDocument.ikh0avvfe3.wasm",
        "hash": "sha256-DtFitfbOscrkFMcLuM3ZYMX3exo5tKmrh7dwPZLFvOU=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.XPath.wasm",
        "name": "System.Xml.XPath.j7e58ql0yh.wasm",
        "hash": "sha256-0SjYR+45q7/uUNboN9XclT3ySN6JDIlNksFRhvFZCS0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.XmlDocument.wasm",
        "name": "System.Xml.XmlDocument.2laigo0hd6.wasm",
        "hash": "sha256-FrbNlERuhoxedEuHbeYCIusl0Uhcn2KP0D5klX17jLA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.XmlSerializer.wasm",
        "name": "System.Xml.XmlSerializer.o9fse2o32f.wasm",
        "hash": "sha256-TJJi6e1mxAcG7VHqHcMSE4A1tEUZ9X75epSk8yPRkvc=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.Xml.wasm",
        "name": "System.Xml.ukjc8es4qk.wasm",
        "hash": "sha256-Hq5jCJZLZNoByIXt7kya+JFz7CHvT5m3H9U1DYAAoa0=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "System.wasm",
        "name": "System.ds37ttt20f.wasm",
        "hash": "sha256-E9DhjlrOHQbpB+NlHRVR1aRp77t3lQJZMkuVvTVf0q8=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "TerrariaWebLoader.wasm",
        "name": "TerrariaWebLoader.m1qllfy11p.wasm",
        "hash": "sha256-5lfjXAjNHsC9uzndV1RwvP1Q8aHCsFY8qaIuEZ1vX3M=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "WindowsBase.wasm",
        "name": "WindowsBase.pulybckt2x.wasm",
        "hash": "sha256-Ib5Six+yw0UXNvuaSfH4BjoWTG5NCJrsRw0dZw7MY0A=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "mscorlib.wasm",
        "name": "mscorlib.a52fw7ypys.wasm",
        "hash": "sha256-YksAmQQaVo/VXw0F9pZ2zrt60t6oaGgWUAUKRsCm2XA=",
        "cache": "force-cache"
      },
      {
        "virtualPath": "netstandard.wasm",
        "name": "netstandard.bf9fg2jjbr.wasm",
        "hash": "sha256-idqxjRcz9AqQ9dP4RTNjJELvrY+9m1NOS4oUsMzfaus=",
        "cache": "force-cache"
      }
    ]
  },
  "debugLevel": 0,
  "globalizationMode": "sharded",
  "runtimeConfig": {
    "runtimeOptions": {
      "configProperties": {
        "System.Diagnostics.Debugger.IsSupported": false,
        "System.Diagnostics.Metrics.Meter.IsSupported": false,
        "System.Diagnostics.Tracing.EventSource.IsSupported": false,
        "System.Globalization.Invariant": false,
        "System.TimeZoneInfo.Invariant": false,
        "System.Linq.Enumerable.IsSizeOptimized": true,
        "System.Net.Http.EnableActivityPropagation": false,
        "System.Net.Http.WasmEnableStreamingResponse": true,
        "System.Net.SocketsHttpHandler.Http3Support": false,
        "System.Reflection.Metadata.MetadataUpdater.IsSupported": false,
        "System.Resources.UseSystemResourceKeys": true,
        "System.Runtime.Serialization.EnableUnsafeBinaryFormatterSerialization": true,
        "System.Text.Encoding.EnableUnsafeUTF7Encoding": false
      }
    }
  }
}/*json-end*/);export{ht as default,gt as dotnet,pt as exit};
