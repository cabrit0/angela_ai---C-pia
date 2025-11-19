import React, { useMemo, useState } from 'react'

interface QuizVideoContextQuestion {
  type: string
  prompt: string
  tags?: string[]
}

export interface QuizVideoContext {
  title: string
  subject?: string
  grade?: string
  introText?: string
  questions?: QuizVideoContextQuestion[]
}

interface QuizVideoSuggestionsProps {
  quizContext?: QuizVideoContext
  value: string[]
  onChange: (videos: string[]) => void
}

type VideoTopic = 'matematica' | 'historia' | 'ciencias' | 'biologia' | 'quimica' | 'fisica' | 'geral'

interface CuratedVideo {
  id: string
  title: string
  channel: string
  viewCount: number
  tags: string[]
  topic: VideoTopic
}

interface SuggestedVideo {
  url: string
  title: string
  source: string
  description?: string
  type: 'search' | 'video'
  canAddDirectly: boolean
}

const STOP_WORDS = new Set([
  'que','para','como','este','esta','este','essa','isso','isso','isso','com','para','qual','quais','onde','quando','porque','perguntas','quiz','texto','apoio','tema','sobre','mais','menos','ainda','pelo','pela','pela','pela','pelo','cada','pois','tudo','algo','apenas','entre','tambem','sera','sao','nos','nas','dos','das','num','numa','uma','uns','umas','nosso','nossa','voc','voces','eles','elas','aquele','aquela','aquele','deste','dessa','destes','dessas'
])

const CURATED_VIDEO_LIBRARY: CuratedVideo[] = [
  {
    id: 'C7NrVLmEYcs',
    title: 'Trigonometria no triangulo retangulo em 13 minutos',
    channel: 'Dicasdemat Sandro Curio',
    viewCount: 906789,
    tags: ['trigonometria','triangulo','seno','cosseno','matematica'],
    topic: 'matematica'
  },
  {
    id: 'D-E_A04ReTE',
    title: 'Seno, cosseno e tangente - trigonometria no triangulo retangulo',
    channel: 'Gis com Giz Matematica',
    viewCount: 2748374,
    tags: ['trigonometria','seno','cosseno','tangente','matematica'],
    topic: 'matematica'
  },
  {
    id: 'r-Vuvb18kUk',
    title: 'Equacao do segundo grau em 6 minutos',
    channel: 'Dicasdemat Sandro Curio',
    viewCount: 2898601,
    tags: ['equacao','segundo','grau','bhaskara','matematica'],
    topic: 'matematica'
  },
  {
    id: 'U1JrT8GFZok',
    title: 'Equacao completa do 2o grau - formula de Bhaskara',
    channel: 'Professora Angela Matematica',
    viewCount: 418679,
    tags: ['equacao','bhaskara','matematica'],
    topic: 'matematica'
  },
  {
    id: 'gW9_Dx5HLjI',
    title: 'Como foi a Independencia do Brasil?',
    channel: 'Toda Materia',
    viewCount: 820274,
    tags: ['independencia', 'brasil', 'historia'],
    topic: 'historia'
  },
  {
    id: 'Fr9lurVLNyo',
    title: 'Independencia do Brasil em 1822 - Historia do Brasil pelo Brasil',
    channel: 'Debora Aladim',
    viewCount: 1020486,
    tags: ['independencia','brasil','historia'],
    topic: 'historia'
  },
  {
    id: 'Xay4R-cB7OA',
    title: 'Era das grandes navegacoes explicada',
    channel: 'Toda Materia',
    viewCount: 404218,
    tags: ['grandes','navegacoes','expansao','maritima','historia'],
    topic: 'historia'
  },
  {
    id: 'aKYtD0e9NZY',
    title: 'Great Navigations e Era das Descobertas',
    channel: 'Imperios AD',
    viewCount: 1192594,
    tags: ['grandes','navegacoes','descobertas','historia'],
    topic: 'historia'
  },
  {
    id: 'Vsnq2hJ2UZc',
    title: 'Entenda a tabela periodica em 10 minutos',
    channel: 'Toda Materia',
    viewCount: 2337140,
    tags: ['tabela','periodica','quimica','elementos'],
    topic: 'quimica'
  },
  {
    id: 'OpASM1pCM2E',
    title: 'Tabela periodica - inicio de tudo',
    channel: 'Cafe com Quimica - Prof. Michel',
    viewCount: 319937,
    tags: ['tabela','periodica','quimica'],
    topic: 'quimica'
  },
  {
    id: 'y0T4gzHg_fs',
    title: 'Fotossintese resumida',
    channel: 'Me Gusta Bio',
    viewCount: 221390,
    tags: ['fotossintese','biologia','plantas','clorofila'],
    topic: 'biologia'
  },
  {
    id: 'fHC6M7xncds',
    title: 'Resumo sobre fotossintese',
    channel: 'Biologia com Samuel Cunha',
    viewCount: 226249,
    tags: ['fotossintese','biologia'],
    topic: 'biologia'
  },
  {
    id: 'Y1S7_OD9Viw',
    title: 'Revolucao Industrial: resumo rapido',
    channel: 'Descomplica',
    viewCount: 3122086,
    tags: ['revolucao','industrial','historia','capitalismo'],
    topic: 'historia'
  },
  {
    id: 't6nJNv-pNr8',
    title: 'Resumo de Historia: Revolucao Industrial',
    channel: 'Debora Aladim',
    viewCount: 2965792,
    tags: ['revolucao','industrial','historia'],
    topic: 'historia'
  },
  {
    id: 'dZfWflhf_IU',
    title: 'Operacoes com fracoes - rapido e facil',
    channel: 'Dicasdemat Sandro Curio',
    viewCount: 2341665,
    tags: ['fracoes','matematica','operacoes'],
    topic: 'matematica'
  },
  {
    id: 'cZkY5RmbM68',
    title: 'Vamos falar de fracoes?',
    channel: 'Descomplica',
    viewCount: 162975,
    tags: ['fracoes','matematica'],
    topic: 'matematica'
  },
  {
    id: 'W9fnE9NdFzo',
    title: 'As tres leis de Newton em 5 minutos',
    channel: 'Toda Materia',
    viewCount: 791733,
    tags: ['leis','newton','fisica'],
    topic: 'fisica'
  },
  {
    id: 'dU14qCv5AuI',
    title: 'Fisica: leis de Newton resumidas',
    channel: 'Hexag Educacional',
    viewCount: 2182580,
    tags: ['leis','newton','fisica','mecanica'],
    topic: 'fisica'
  }
]

const normalizeText = (text?: string) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const tokenize = (text?: string) => {
  if (!text) return []
  return normalizeText(text)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3 && !STOP_WORDS.has(token))
}

const extractKeywords = (parts: string[]): string[] => {
  const freq = new Map<string, number>()
  parts.forEach((part) => {
    tokenize(part).forEach((token) => {
      freq.set(token, (freq.get(token) ?? 0) + 1)
    })
  })
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)
    .slice(0, 10)
}

const inferTopicFromSubject = (subject?: string): VideoTopic => {
  const normalized = normalizeText(subject)
  if (!normalized) return 'geral'
  if (normalized.includes('mat')) return 'matematica'
  if (normalized.includes('fis')) return 'fisica'
  if (normalized.includes('quim')) return 'quimica'
  if (normalized.includes('bio')) return 'biologia'
  if (normalized.includes('hist')) return 'historia'
  if (normalized.includes('cien')) return 'ciencias'
  return 'geral'
}

const formatViewCount = (count: number) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)} mi visualizacoes`
  if (count >= 1000) return `${Math.round(count / 1000)} mil visualizacoes`
  return `${count} visualizacoes`
}

const buildSearchSuggestions = (baseQuery: string, keywords: string[]): SuggestedVideo[] => {
  const keywordSnippet = keywords.slice(0, 3).join(' ')
  const root = [baseQuery, keywordSnippet].filter(Boolean).join(' ').trim()
  const templates = [
    {
      title: 'Pesquisa: explicacoes detalhadas',
      suffix: 'explicacao completa',
      meta: 'Pesquisa contextual (tema + texto + perguntas)'
    },
    {
      title: 'Pesquisa: exercicios resolvidos',
      suffix: 'exercicios resolvidos passo a passo',
      meta: 'Pesquisa contextual (foco em pratica)'
    },
    {
      title: 'Pesquisa: aula completa',
      suffix: 'aula completa no YouTube',
      meta: 'Pesquisa contextual (aulas longas)'
    },
    {
      title: 'Pesquisa: resumos rapidos',
      suffix: 'resumo rapido revisao',
      meta: 'Pesquisa contextual (revisoes)'
    },
    {
      title: 'Pesquisa: experimento ou demonstracao',
      suffix: 'demonstracao pratica',
      meta: 'Pesquisa contextual (demonstracoes)'
    }
  ]

  return templates.slice(0, 4).map((template) => {
    const searchQuery = [root, template.suffix].filter(Boolean).join(' ')
    const params = new URLSearchParams({ search_query: searchQuery })
    return {
      url: `https://www.youtube.com/results?${params.toString()}`,
      title: template.title,
      source: template.meta,
      description: searchQuery,
      type: 'search' as const,
      canAddDirectly: false,
    }
  })
}

const buildCuratedVideos = (
  keywords: string[],
  topic: VideoTopic,
  desired = 2
): SuggestedVideo[] => {
  const keywordSet = new Set(keywords)

  const scored = CURATED_VIDEO_LIBRARY.map((video) => {
    const videoSet = new Set(video.tags)
    let overlap = 0
    keywordSet.forEach((token) => {
      if (videoSet.has(token)) overlap += 1
    })
    const topicBoost = video.topic === topic ? 3 : 0
    const score = overlap * 4 + topicBoost + Math.log10(video.viewCount + 1)
    return { video, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const selected = scored.slice(0, desired).map(({ video }) => video)

  if (selected.length < desired) {
    const complement = CURATED_VIDEO_LIBRARY
      .filter((video) => !selected.includes(video))
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, desired - selected.length)
    selected.push(...complement)
  }

  return selected.map((video) => ({
    url: `https://www.youtube.com/watch?v=${video.id}`,
    title: video.title,
    source: `Canal ${video.channel}`,
    description: formatViewCount(video.viewCount),
    type: 'video' as const,
    canAddDirectly: true,
  }))
}

const QuizVideoSuggestions: React.FC<QuizVideoSuggestionsProps> = ({
  quizContext,
  value,
  onChange,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestedVideo[]>([])

  const contextualData = useMemo(() => {
    if (!quizContext) {
      return { keywords: [], baseQuery: '', topic: 'geral' as VideoTopic }
    }

    const questionPrompts = (quizContext.questions ?? []).map((q) => `${q.prompt} ${(q.tags ?? []).join(' ')}`)
    const parts = [quizContext.title, quizContext.subject, quizContext.introText, ...questionPrompts].filter(Boolean) as string[]
    const keywords = extractKeywords(parts)
    const topic = inferTopicFromSubject(quizContext.subject)
    const baseQuery = [quizContext.title, quizContext.subject, quizContext.grade].filter(Boolean).join(' ')
    return { keywords, baseQuery, topic }
  }, [quizContext])

  const manualInputId = useMemo(() => {
    const raw = quizContext?.title?.toLowerCase() ?? 'youtube-manual'
    return raw.replace(/[^a-z0-9]+/g, '-')
  }, [quizContext?.title])

  const handleSuggest = () => {
    if (!quizContext) return
    setIsLoading(true)
    setError(null)

    window.setTimeout(() => {
      const directVideos = buildCuratedVideos(contextualData.keywords, contextualData.topic, 2)
      const searchVideos = buildSearchSuggestions(contextualData.baseQuery, contextualData.keywords)
      const combined: SuggestedVideo[] = []
      const queue = [...directVideos, ...searchVideos]
      queue.forEach((item) => {
        if (!value.includes(item.url)) {
          combined.push(item)
        }
      })

      if (combined.length === 0) {
        setError('Sem sugestoes automaticas neste momento. Ajuste o texto do quiz ou adicione links manualmente.')
      }
      setSuggestions(combined.slice(0, 6))
      setIsLoading(false)
    }, 250)
  }

  const normalizeYouTubeUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return ''
    try {
      const parsed = new URL(trimmed)
      if (parsed.hostname === 'youtu.be') {
        const id = parsed.pathname.replace('/', '')
        return id ? `https://www.youtube.com/watch?v=${id}` : trimmed
      }
      if (parsed.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com${parsed.pathname}${parsed.search}`
      }
      if (parsed.searchParams.has('v')) {
        return `https://www.youtube.com/watch?v=${parsed.searchParams.get('v')}`
      }
      return parsed.toString()
    } catch {
      return trimmed
    }
  }

  const handleAddVideo = (url: string) => {
    const normalized = normalizeYouTubeUrl(url)
    if (!normalized) return false
    if (!normalized.includes('youtu')) return false
    const next = Array.from(new Set([...value, normalized]))
    onChange(next)
    return true
  }

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!manualUrl.trim()) {
      setManualError('Cole um link valido do YouTube.')
      return
    }
    const result = handleAddVideo(manualUrl.trim())
    if (!result) {
      setManualError('Nao conseguimos validar este link. Use URLs youtube.com ou youtu.be.')
      return
    }
    setManualError(null)
    setManualUrl('')
  }

  const handleSuggestionAdd = (url: string) => {
    const added = handleAddVideo(url)
    if (!added) {
      setError('Nao conseguimos adicionar automaticamente este link. Abra o video e copie o URL completo.')
      return
    }
    setError(null)
  }

  const handleRemoveVideo = (url: string) => {
    onChange(value.filter((video) => video !== url))
  }

  if (!quizContext || !quizContext.title || !quizContext.questions || quizContext.questions.length === 0) {
    return null
  }

  return (
    <section className="mt-10 rounded-3xl border border-gray-200 bg-white/95 p-6 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-slate-900/80 relative">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">YouTube</p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Sugestões de vídeos para este quiz</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Usamos o título, a disciplina, o texto de apoio e as perguntas criadas para gerar pesquisas seguras. Gere sugestões e abra ou adicione os vídeos recomendados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSuggest}
            disabled={isLoading}
            className={`inline-flex items-center justify-center rounded-2xl px-5 py-2 text-sm font-semibold transition-colors ${
              isLoading
                ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
                : 'border border-blue-200 bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:border-blue-500/40 dark:bg-blue-500'
            }`}
          >
            {isLoading ? 'A gerar...' : 'Gerar sugestões'}
          </button>
        </div>
      </div>

      <form className="mt-6 rounded-2xl border border-dashed border-gray-300/80 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-slate-900/40" onSubmit={handleManualSubmit}>
        <label htmlFor={manualInputId} className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Adicionar vídeo manualmente
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id={manualInputId}
            type="url"
            value={manualUrl}
            onChange={(event) => {
              setManualUrl(event.target.value)
              setManualError(null)
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input flex-1 bg-white dark:bg-slate-900/70"
          />
          <button type="submit" className="btn btn-primary whitespace-nowrap px-6 py-3 text-sm font-semibold">
            Adicionar
          </button>
        </div>
        {manualError ? (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">{manualError}</p>
        ) : (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Aceitamos URLs youtube.com/watch e youtu.be. O vídeo será incorporado automaticamente no quiz.
          </p>
        )}
      </form>

      {error && <p className="mt-4 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {suggestions.length > 0 && (
        <div className="mt-6 space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.url}-${index}`}
              className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-slate-900/70"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{suggestion.title}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {suggestion.source}
                  </p>
                  {suggestion.description && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {suggestion.description}
                    </p>
                  )}
                  <p className="text-[11px] text-blue-600 break-all dark:text-blue-300">{suggestion.url}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {suggestion.canAddDirectly && (
                    <button
                      type="button"
                      onClick={() => handleSuggestionAdd(suggestion.url)}
                      className="inline-flex items-center rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 dark:border-green-500/40 dark:bg-green-900/30 dark:text-green-300"
                    >
                      Adicionar
                    </button>
                  )}
                  <a
                    href={suggestion.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Abrir
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Videos associados ao quiz</p>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {value.length} {value.length === 1 ? 'vídeo' : 'vídeos'}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {value.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm dark:border-gray-700 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="flex-1 break-all text-xs font-medium text-gray-800 dark:text-gray-100">{url}</p>
                <div className="flex items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveVideo(url)}
                    className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-900/30 dark:text-red-300"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default QuizVideoSuggestions
