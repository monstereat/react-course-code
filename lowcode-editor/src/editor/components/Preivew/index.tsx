import React, { useRef } from "react";
import { useComponentConfigStore } from "../../stores/component-config";
import { Component, useComponetsStore } from "../../stores/components"
import { message } from "antd";
import { ActionConfig } from "../Setting/ActionModal";
import * as Babel from '@babel/standalone';
// import { transform } from "sucrase";
// import * as babel from '@babel/core';
// import babel from '@babel/core';

function convertLetToVar (code:any) {
	// 使用 Babel 的 transformSync 方法转换代码
	console.log('code', code)
	console.log('babel', Babel)
	// const result:any = Babel.transform(code, {
	// 	presets: ['env'],  // 使用 preset-env 转换为兼容的代码
	// });

	// return result.code;
}

export function Preview() {
    const { components } = useComponetsStore();
    const { componentConfig } = useComponentConfigStore();

    const componentRefs = useRef<Record<string, any>>({});

    function handleEvent(component: Component) {
        const props: Record<string, any> = {};

        componentConfig[component.name].events?.forEach((event) => {
            const eventConfig = component.props[event.name];

            if (eventConfig) {
                props[event.name] = () => {
                    eventConfig?.actions?.forEach((action: ActionConfig) => {
                        if (action.type === 'goToLink') {
                            window.location.href = action.url;
                        } else if (action.type === 'showMessage') {
                            if (action.config.type === 'success') {
                                message.success(action.config.text);
                            } else if (action.config.type === 'error') {
                                message.error(action.config.text);
                            }
                        } else if(action.type === 'customJS') {
													const codeToCompile = action.code;
													// let compiledCode = codeToCompile
													console.log('(Window as any).Babel', (Window as any).Babel)
													
													
													let formatCode = (Babel as any).transform(codeToCompile, {
														// presets: ['env','react'], // 添加需要的 preset
														presets: ['env'],
														
													}).code;
													// let compiledCode = transform(codeToCompile, {
													// 	transforms: ["typescript", "imports", "jsx"],
													// }).code;
													// let formatCode = convertLetToVar(codeToCompile)
													
													console.log('codeToCompile', codeToCompile)
													let compiledCode = formatCode
													console.log('formatCode', formatCode)
													
													// console.log('xxxxx', compiledCode)
													// compiledCode = compiledCode.replace(/^\s*["']use strict["'];?/m, '')

													let iframe:any= document.createElement('iframe');
  												iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts');
													iframe.style.display = 'none';
  												document.documentElement.appendChild(iframe);

													// function executeCode(code: string, globalScope: any, iframe: any) {
													// 	const sandbox = iframe.contentWindow
													// 	sandbox.__INJECT_VARS__ = globalScope;
												
													// 	return sandbox.eval(`
													// 		(() => {
													// 			with (window.__INJECT_VARS__) { 
													// 				return (${code})
													// 			}
													// 		})()
													// 	`);
													// }

													const compileModuleResolve = (
														code: string,
														dependencies: Record<string, any> = {}
													) => {
														// 实现module函数，用来套动态执行的函数结果
														const module: any = {
															exports: {
																__esModule: false,
																default: null as unknown,
															},
														};
													
														// 实现一个require方法，用于模块执行时挂载依赖
														const require = (packageName: string) => {
															if (dependencies[packageName]) {
																return dependencies[packageName];
															}
														};
														// 动态执行
														Function("require, exports, module", code)(require, module.exports, module);
														return module;
													};

													let dependencies: Record<string, any> = {};

													// const module:any = compileModuleResolve(compiledCode, dependencies)
													// console.log('module', module)

													function executeCode(code: string, globalScope:any, iframe: any) {
														iframe.contentWindow.myName = '王老板'
														let sandbox = iframe.contentWindow;
														
													console.log('sandbox', sandbox)
														// 将 globalScope 里的所有变量作为参数传递给新函数
														// const functionBody = `
														// 	return ${code};
														// `;
														
														// console.log('functionBody', functionBody)
														// 创建新的函数并执行
														const func = new sandbox.Function(...Object.keys(globalScope), code);
													
														// 将 globalScope 的值传递给新函数
														const result = func(...Object.values(globalScope));
														sandbox.result = result;
														console.log('resulxxt', sandbox.result)
														// console.log('sandbox', ...Object.keys(globalScope))

														return result;
													}
													const globalScope = {
														context:{
															name: component.name,
															props: component.props,
														},
														showMessage(content: string) {
															message.success(content);
														}
													};
													console.log('compiledCode111', compiledCode)

													

													executeCode(compiledCode, globalScope, iframe);
													
                            // const func = new Function('context', compiledCode);
                            // func({
                            //     name: component.name,
                            //     props: component.props,
                            //     showMessage(content: string) {
                            //         message.success(content)
                            //     }
                            // });
                        } else if(action.type === 'componentMethod') {
                            const component = componentRefs.current[action.config.componentId];

                            if (component) {
                              component[action.config.method]?.();
                            }
                        }
                    })
                    
                }
            }
        })
        return props;
    }

    function renderComponents(components: Component[]): React.ReactNode {
        return components.map((component: Component) => {
            const config = componentConfig?.[component.name]

            if (!config?.prod) {
                return null;
            }
            
            return React.createElement(
                config.prod,
                {
                    key: component.id,
                    id: component.id,
                    name: component.name,
                    styles: component.styles,
                    ref: (ref: Record<string, any>) => { componentRefs.current[component.id] = ref; },
                    ...config.defaultProps,
                    ...component.props,
                    ...handleEvent(component)
                },
                renderComponents(component.children || [])
            )
        })
    }

    return <div>
        {renderComponents(components)}
    </div>
}