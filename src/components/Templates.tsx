import { flows } from '../base'
import { useCallback, useState } from 'react'
import useOpenai from '../hooks/useOpenai'
import { setEnvData } from '../redux/envReducer'
import { useAppDispatch, useAppSelector } from '../hooks/redux'
import { toast } from 'react-toastify'

const MenuItem = (props: {
  type: 'normal' | 'settings'
  helpItem: HelpItem
  zIndex?: number
  helpTypeName: string
}) => {
  const { type, helpItem, zIndex = 100, helpTypeName } = props
  const { navResult } = useOpenai()
  const [checked, setChecked] = useState(() => type === 'settings' && !!window.utools?.getFeatures([`cmd-${helpItem.code}`])[0])

  const onClick = useCallback(() => {
    if (helpItem.children?.length) return
    if (!helpItem.prompt) return

    if (type === 'normal') {
      navResult(helpItem.prompt)
    } else {
      if (checked) {
        setChecked(false)
        utools.removeFeature(`cmd-${helpItem.code}`)
      } else {
        setChecked(true)
        // @ts-expect-error
        utools.setFeature({
          code: `cmd-${helpItem.code}`,
          explain: helpItem.featureName ?? helpItem.name,
          // platform: ['win32', 'darwin', 'linux'],
          cmds: [{
            type: 'over',
            label: helpItem.featureName ?? helpItem.name
          }]
        })
      }
    }
  }, [checked, helpItem.children?.length, helpItem.code, helpItem.featureName, helpItem.name, helpItem.prompt, navResult, type])

  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.env.env)
  const onDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()

    if (!envData.helpItemsMap) {
      envData.helpItemsMap = {}
    }
    const helpItemsMap = { ...envData.helpItemsMap }
    const { [helpItem.code]: _, ...rest } = envData.helpItemsMap[helpTypeName];
    helpItemsMap[helpTypeName] = { ...rest }
    dispatch(setEnvData({
      helpItemsMap: helpItemsMap,
    }))
  }, [helpTypeName, helpItem, dispatch, envData])

  return <li>
    <a className='flex justify-between items-center' onClick={onClick}>
      {helpItem.name}
      {helpItem.children?.length && <img className='w-[16px] h-[16px]' src='right.svg' />}
      {checked && <img className='w-[16px] h-[16px]' src='success.svg' />}
      {(type === 'settings' && helpItem.customized) && <button onClick={onDelete} >❌</button>}
    </a>
    {helpItem.children?.length && <ul className='p-2 rounded shadow-card menu menu-compact bg-base-100' style={{
      color: 'var(--c-desc)',
      zIndex,
    }}>
      {helpItem.children?.map((child, idx) => <MenuItem helpItem={child} key={idx} type={type} zIndex={zIndex + 10} helpTypeName={helpTypeName} />)}
    </ul>}
  </li>
}

const Templates = (props: {
  type: 'normal' | 'settings'
}) => {
  const { type } = props
  const dispatch = useAppDispatch()
  const envData = useAppSelector(state => state.env.env)
  console.log('envData：', envData)

  // 添加状态管理
  const [showHelpItemEditForm, setShowHelpItemEditForm] = useState(false);
  const [helpItemFormData, setHelpItemFormData] = useState<HelpItemFormData>({
    helpType: '',
    code: '',
    name: '',
    role: '',
    instruct: ''
  });
  const [helpItemEditError, setHelpItemEditErrors] = useState({
    name: false,
    role: false,
    instruct: false
  });

  const handleAddHelpItem = (helpTypeName: string) => {
    setHelpItemFormData({ ...helpItemFormData, helpType: helpTypeName });
    // todo for debug, edit to false
    if (false) {
      dispatch(setEnvData({
        helpItemsMap: undefined,
      }))
    }
    setShowHelpItemEditForm(true);
  };

  const Type = (props: {
    type: 'normal' | 'settings'
    helpType: HelpType
  }) => {
    const { type, helpType } = props
    return <div className=''>
      <ul className='p-2 rounded shadow-card menu menu-compact' style={{ color: 'var(--c-desc)' }}>
        <li className="menu-title">
          <span className="flex justify-between items-center w-full">
            {helpType.name}
            {type === 'settings' && <button onClick={() => handleAddHelpItem(helpType.name)} >➕</button>}
          </span>
        </li>
        {helpType.items.map((item, idx) => <MenuItem key={idx} type={type} helpItem={item} helpTypeName={helpType.name} />)}
      </ul>
    </div>
  }

  const Flow = (props: {
    type: 'normal' | 'settings'
    helpFlow: HelpFlow
  }) => {
    const { type, helpFlow } = props
    return <div className='basis-1 flex-1 flex flex-col gap-2'>
      {helpFlow.types.map((t, idx) => <Type key={idx} type={type} helpType={t} />)}
    </div>
  }

  // 表单提交处理
  const handleHelpItemEditFormSubmit = (data: HelpItemFormData) => {
    console.log('表单数据：', data);
    if (envData.helpItemsMap?.[data.helpType]?.[data.code]) {
      toast.warning(`该分类下已经存在同名的自定义快捷指令: ${data.name}`)
      return
    }

    const helpItemsMap = { ...envData.helpItemsMap, [data.helpType]: { ...envData.helpItemsMap?.[data.helpType], [data.code]: data } }
    dispatch(setEnvData({
      helpItemsMap: helpItemsMap,
    }))

    onHelpItemEditFormDisappear()
  };
  const handleHelpItemEditFormClose = () => {
    onHelpItemEditFormDisappear()
  };
  const onHelpItemEditFormDisappear = () => {
    setShowHelpItemEditForm(false);
    setHelpItemFormData({ helpType: '', code: '', name: '', role: '', instruct: '' });
    setHelpItemEditErrors({ name: false, role: false, instruct: false });
  }

  return (
    <div>
      {/* 快捷指令部分 */}
      <div className='flex gap-2 mx-3 mb-3'>
        {flows.map((flow, idx) => <Flow key={idx} type={type} helpFlow={flow} />)}
      </div>

      {/* 添加快捷指令模态框部分 */}
      {showHelpItemEditForm && (
        <div style={helpItemEditFormStyles.overlay} onClick={handleHelpItemEditFormClose}>
          <div style={helpItemEditFormStyles.modal} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={(e) => {
              e.preventDefault();
              // 获取输入元素，获取值并去空格
              const name = (document.getElementById('helpItem-name') as HTMLInputElement).value.trim();
              const role = (document.getElementById('helpItem-role') as HTMLInputElement).value.trim();
              const instruct = (document.getElementById('helpItem-instruct') as HTMLTextAreaElement).value.trim();

              // 校验非空
              const newErrors = {
                name: name === '',
                role: role === '',
                instruct: instruct === ''
              };
              if (Object.values(newErrors).some(error => error)) {
                setHelpItemEditErrors(newErrors);
                return;
              }

              // 组装表单数据
              const formData = {
                helpType: helpItemFormData.helpType,
                name,
                role,
                instruct,
                code: name
              } as HelpItemFormData;
              handleHelpItemEditFormSubmit(formData);
            }}>
              <h3 style={{ marginBottom: 20 }}>添加快捷指令</h3>
              <div style={helpItemEditFormStyles.formGroup}>
                <label htmlFor="helpItem-name">
                  名称：
                  {helpItemEditError.name && <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>必填</span>}
                </label>
                <input
                  id="helpItem-name"
                  type="text"
                  defaultValue={helpItemFormData.name}
                  style={helpItemEditFormStyles.input}
                />
              </div>
              <div style={helpItemEditFormStyles.formGroup}>
                <label htmlFor="helpItem-role">
                  角色：
                  {helpItemEditError.role && <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>必填</span>}
                </label>
                <input
                  id="helpItem-role"
                  type="text"
                  defaultValue={helpItemFormData.role}
                  style={helpItemEditFormStyles.input}
                />
              </div>
              <div style={helpItemEditFormStyles.formGroup}>
                <label htmlFor="helpItem-instruct">
                  指令：
                  {helpItemEditError.instruct && <span style={{ color: 'red', fontSize: 12, marginLeft: 8 }}>必填</span>}
                </label>
                <textarea
                  id="helpItem-instruct"
                  defaultValue={helpItemFormData.instruct}
                  style={{ ...helpItemEditFormStyles.input, minHeight: 100 }}
                  rows={4}
                />
              </div>
              <div style={helpItemEditFormStyles.buttonGroup}>
                <button type="button" style={helpItemEditFormStyles.cancelButton} onClick={handleHelpItemEditFormClose}>
                  取消
                </button>
                <button type="submit" style={helpItemEditFormStyles.confirmButton}>
                  确认
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 样式定义
const helpItemEditFormStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '400px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  },
  formGroup: {
    marginBottom: '15px',
    label: {
      display: 'block',
      marginBottom: '5px',
    },
    input: {
      width: '100%',
      padding: '8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
    },
  },
  buttonGroup: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
  },
  confirmButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    background: '#1890ff',
    color: 'white',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  }
} as const;

export default Templates
