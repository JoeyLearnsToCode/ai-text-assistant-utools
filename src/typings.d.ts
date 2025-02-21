interface Result<T> {
  success: boolean
  code: string
  message?: string
  map?: {
    data?: T
    [key: string]: any
  }
}

interface SeeTime {
  enable: boolean
  min: number
  max: number
  unit: TimeUnit
}

interface HelpFlow {
  types: HelpType[]
}

interface HelpType {
  name: string
  items: HelpItem[]
}

interface HelpItem {
  code: string
  name: string
  featureName?: string
  prompt?: string
  children?: HelpItem[]
  customized?: boolean
}

type HelpItemFormData = {
  helpType: string;
  code: string;
  name: string;
  role: string;
  instruct: string;
};

type ShowElement = string | JSX.Element | undefined

type OpenaiStatus = 'init' | 'loading' | 'finish'
