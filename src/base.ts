import { LANGUAGES, TONES } from './const'
import { EnvData } from './redux/envReducer'

const templateSimple = (role: string, command: string) => {
  return `${role}. ${command} in language '{{language}}': '''{{text}}'''`
}

const templateLong = (role: string, command: string) => {
  return `${role}. ${command} in language '{{language}}':

'''
{{text}}
'''`
}

const getTransChildren = () => {
  return LANGUAGES.map((lang) => {
    return {
      code: `trans-${lang.code}`,
      name: lang.name,
      featureName: `👉 翻译-${lang.name}`,
      prompt: `You are a professional translator. Translate following text to language '${lang.name}':

'''
{{text}}
'''`
    }
  })
}

const getTones = () => {
  return TONES.map(tone => {
    return {
      code: `tone-${tone.value}`,
      name: tone.name,
      featureName: `👉 语调-${tone.name}`,
      prompt: templateLong('You are a professional copywriter', `Change tone of following text to more '${tone.value}'`)
    }
  })
}

export const flows: HelpFlow[] = []
export const defaultFlows: HelpFlow[] = [
  {
    types: [
      {
        name: '生成类',
        items: [
          {
            code: 'trans',
            name: '🌍 翻译',
            children: getTransChildren(),
          },
          {
            code: 'summarize',
            name: '📚 总结',
            featureName: '👉 总结',
            prompt: templateLong('You are a professional summarizer', 'Summarize following text'),
          },
        ]
      },
      {
        name: '写作类',
        items: [
          {
            code: 'continue',
            name: '🖋 续写',
            featureName: '👉 续写',
            prompt: templateLong('You are a professional copywriter', 'Continue writing following text'),
          },
        ]
      },
      {
        name: '提问类',
        items: [
          {
            code: 'explain',
            name: '🤔 解释',
            featureName: '👉 解释',
            prompt: templateLong('You are a professional explainer', 'Explain following text'),
          },
        ]
      },
    ]
  },
  {
    types: [
      {
        name: '编辑类',
        items: [
          {
            code: 'tone',
            name: '🎓 语调',
            children: getTones(),
          },
          {
            code: 'improve',
            name: '✍️ 改进表达',
            featureName: '👉 改进表达',
            prompt: templateLong('You are a professional copywriter', 'Improve following text')
          },
          {
            code: 'fix',
            name: '📝 修正语法',
            featureName: '👉 修正语法',
            prompt: templateLong('You are a professional copywriter', 'Fix spelling & grammar of following text')
          },
          {
            code: 'shorten',
            name: '📉 改短些',
            featureName: '👉 改短些',
            prompt: templateLong('You are a professional copywriter', 'Make following text SHORTER')
          },
          {
            code: 'lengthen',
            name: '📈 改长些',
            featureName: '👉 改长些',
            prompt: templateLong('You are a professional copywriter', 'Make following text LONGER')
          },
          {
            code: 'simplify',
            name: '🔄 简化',
            featureName: '👉 简化',
            prompt: templateLong('You are a professional copywriter', 'Simplify language of following text')
          },
        ]
      },
    ]
  },
  {
    types: [
      {
        name: '草稿类',
        items: [
          {
            code: 'brainstorm',
            name: '💡 头脑风暴',
            featureName: '👉 头脑风暴',
            prompt: templateSimple('You are a helpful assistant', 'Brainstorm ideas on following topic'),
          },
          {
            code: 'blog',
            name: '✍️ 写博客',
            featureName: '👉 写博客',
            prompt: templateSimple('You are a professional copywriter', 'Write a blog post about following topic'),
          },
          {
            code: 'outline',
            name: '✍️ 写框架',
            featureName: '👉 写框架',
            prompt: templateSimple('You are a professional copywriter', 'Write a outline about following topic'),
          },
          {
            code: 'social',
            name: '✍️ 写社交媒体文章',
            featureName: '👉 写社交媒体文章',
            prompt: templateSimple('You are a professional copywriter', 'Write a social media post about following topic'),
          },
          {
            code: 'todo',
            name: '✍️ 写待办事项',
            featureName: '👉 写待办事项',
            prompt: templateSimple('You are a professional copywriter', 'Write a To-do list about following topic'),
          },
        ]
      },
    ]
  },
]

export const extraHelpTypes: { [key: string]: HelpType } = {
}

export const refreshFlows = () => {
  const tmpFlows: HelpFlow[] = []
  for (const flow of defaultFlows) {
    tmpFlows.push({
      types: flow.types.map(type => {
        return {
          name: type.name,
          items: type.items.map(item => {
            return {
              ...item
            }
          })
        }
      })
    })
  }

  for (const [name, helpType] of Object.entries(extraHelpTypes)) {
    for (const tmpFlow of tmpFlows) {
      const foundType = tmpFlow.types.find(type2 => type2.name === name)
      if (foundType) {
        foundType.items.push(...helpType.items)
      }
    }
  }

  flows.splice(0, flows.length)
  flows.push(...tmpFlows)
}

export const loadHelpItemsFromEnvData = (envData: EnvData) => {
  if (!envData.helpItemsMap) {
    return;
  }

  // turn envData.helpItemsMap into extraHelpTypes
  for (const [helpTypeName, helpItemFormDataMap] of Object.entries(envData.helpItemsMap)) {
    extraHelpTypes[helpTypeName] = { name: helpTypeName, items: [] };
    for (const helpItemFormData of Object.values(helpItemFormDataMap)) {
      extraHelpTypes[helpTypeName].items.push({
        code: helpItemFormData.code,
        name: helpItemFormData.name,
        featureName: helpItemFormData.name,
        prompt: templateLong(helpItemFormData.role, helpItemFormData.instruct),
        customized: true,
      });
    }
  }
};
