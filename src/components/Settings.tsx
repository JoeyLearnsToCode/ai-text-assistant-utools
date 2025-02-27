import React, {PropsWithChildren, useCallback, useState} from 'react'
import {useAppDispatch, useAppSelector} from '../hooks/redux'
import {setEnvData, setPage} from '../redux/envReducer'
import classNames from 'classnames'
import {PAGE_MAIN, PROMPT_DEFAULT, SERVER_URL_DEFAULT} from '../const'
import {useBoolean, useEventTarget} from 'ahooks'
import {toast} from 'react-toastify'
import {openUrl} from '../util/biz_util'
import Templates from './Templates'
import {track} from '../util/stats_util'

const Section = (props: {
  title: ShowElement
  htmlFor?: string
} & PropsWithChildren) => {
  const {title, htmlFor, children} = props
  return <div className='flex flex-col gap-1'>
    <label className='font-medium desc-lighter text-xs' htmlFor={htmlFor}>{title}</label>
    <div className='flex flex-col gap-1 rounded py-2 px-2 bg-base-200/75'>{children}</div>
  </div>
}

const FormItem = (props: {
  title: ShowElement
  tip?: string
  htmlFor?: string
} & PropsWithChildren) => {
  const {title, tip, htmlFor, children} = props
  return <div className='flex items-center gap-2'>
    <div
      className={classNames('basis-3/12 flex', tip && 'tooltip tooltip-right z-[100] underline underline-offset-2 decoration-dashed')}
      data-tip={tip}>
      <label className='font-medium desc' htmlFor={htmlFor}>{title}</label>
    </div>
    <div className='basis-9/12 flex items-center'>
      {children}
    </div>
  </div>
}

const Settings = () => {
  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.env.env)

  const [apiKeyValue, {onChange: onChangeApiKeyValue}] = useEventTarget({initialValue: envData.apiKey ?? ''})
  const [serverUrlValue, setServerUrlValue] = useState(envData.serverUrl)
  const [apiModelValue, {onChange: onChangeApiModelValue}] = useEventTarget({ initialValue: envData.apiModel ?? '' })
  const [moreFold, {toggle: toggleMoreFold}] = useBoolean(true)
  const [moreFold2, {toggle: toggleMoreFold2}] = useBoolean(true)
  const [promptValue, setPromptValue] = useState(envData.prompt ?? PROMPT_DEFAULT)

  const onOk = useCallback(() => {
    dispatch(setEnvData({
      apiKey: apiKeyValue,
      serverUrl: serverUrlValue,
      apiModel: apiModelValue,
      prompt: promptValue,
    }))
    dispatch(setPage(PAGE_MAIN))
    toast.success('保存成功')

    track('save_settings', {
      v_set_url: !!serverUrlValue+'',
      v_set_api_key: !!apiKeyValue+'',
    })
  }, [apiKeyValue, dispatch, promptValue, serverUrlValue, apiModelValue])

  const onCancel = useCallback(() => {
    dispatch(setPage(PAGE_MAIN))
  }, [dispatch])

  return <div className='flex flex-col gap-3 p-2'>
    <Section title='OpenAI配置'>
      <FormItem title='API URL' htmlFor='serverUrl'>
        <input id='serverUrl' type='text' className='input input-sm input-bordered w-full'
               placeholder='服务器地址,默认使用官方地址' value={serverUrlValue}
               onChange={e => setServerUrlValue(e.target.value)}/>
      </FormItem>
      <div className='flex justify-center'>
        <a className='link text-xs' onClick={toggleMoreFold}>{moreFold ? '点击查看说明' : '点击折叠说明'}</a>
      </div>
      {!moreFold && <div className='p-2'>
        <ul className='pl-3 list-decimal desc text-xs'>
          <li>OpenAI 官方网址：<a className='link' href='https://platform.openai.com/' target='_blank'
                          rel="noreferrer" onClick={() => openUrl('https://platform.openai.com/')}>openai.com</a> | <a className='link'
                                                               onClick={() => setServerUrlValue(SERVER_URL_DEFAULT)}
                                                               rel='noreferrer'>点击设置</a></li>
          <li>如果你有三方、中转的 OpenAI API 格式的 API，也可以在这里填写后使用。</li>
          <li>很多 AI 厂商的 API 都使用、兼容 OpenAI API 的格式</li>
        </ul>
      </div>}
      <FormItem title='API KEY*' htmlFor='apiKey'>
        <input id='apiKey' type='text' className='input input-sm input-bordered w-full' placeholder='sk-xxx'
               value={apiKeyValue} onChange={onChangeApiKeyValue}/>
      </FormItem>
      <FormItem title='API Model' htmlFor='apiModel'>
        <input id='apiModel' type='text' className='input input-sm input-bordered w-full' placeholder='gpt-4o-mini'
          value={apiModelValue} onChange={onChangeApiModelValue} />
      </FormItem>
      <FormItem title={<div>
        <div>自定义提示词</div>
        <div className='link text-xs' onClick={() => {
          setPromptValue(PROMPT_DEFAULT)
        }}>点击填充默认
        </div>
      </div>} htmlFor='prompt'>
            <textarea id='prompt' className='mt-2 textarea input-bordered w-full h-32' placeholder='留空使用默认提示词'
                      value={promptValue} onChange={(e) => {
                        setPromptValue(e.target.value)
                      }}/>
      </FormItem>
      <div className='flex justify-center'>
        <a className='link text-xs' onClick={toggleMoreFold2}>{moreFold2 ? '点击查看说明' : '点击折叠说明'}</a>
      </div>
      {!moreFold2 && <div className='p-2'>
        <span className='desc text-sm'>支持以下变量：</span>
        <ul className='pl-3 list-decimal desc text-xs'>
          <li>{'{{text}}: 文本内容'}</li>
          <li>{'{{question}}: 提问内容'}</li>
          <li>{'{{language}}: 目标语言'}</li>
        </ul>
      </div>}
    </Section>
    <Section title={<div className='flex flex-col'>
      快捷指令配置（即时生效，慎重删除）
    </div>}>
      <div className='pt-3'>
        <Templates type='settings'/>
        {/* <div className='text-xs desc pl-3 italic'>注：功能配置即时生效</div> */}
      </div>
    </Section>
    <div className='flex flex-col items-center gap-1'>
      <button className='btn btn-primary btn-wide' onClick={onOk}>确认</button>
      <button className='btn btn-ghost btn-wide' onClick={onCancel}>取消</button>
    </div>
  </div>
}

export default Settings
