// Utility functions for extracting keywords from questions and generating image prompts

// Common Portuguese stop words to filter out
const PORTUGUESE_STOP_WORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'e', 'ou', 'mas', 'se', 'por', 'para', 'com', 'sem', 'em', 'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'pelo', 'pela', 'pelos', 'pelas',
  'que', 'quem', 'qual', 'quais', 'cujo', 'cuja', 'cujos', 'cujas', 'como', 'quando', 'onde', 'porque', 'porquê', 'por que', 'assim', 'também', 'não', 'sim', 'mais', 'menos', 'muito', 'pouco',
  'é', 'são', 'está', 'estão', 'foi', 'foram', 'ser', 'será', 'serão', 'estar', 'estará', 'este', 'esta', 'esteve', 'estiver', 'haver', 'há', 'houve', 'houver', 'ter', 'tem', 'teve', 'terá', 'terão',
  'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'me', 'te', 'se', 'lhe', 'lhes', 'nos', 'vos', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'este', 'esta', 'isto', 'esse', 'essa', 'isso', 'aquele', 'aquela', 'aquilo', 'isto', 'outro', 'outra', 'outros', 'outras', 'todo', 'toda', 'todos', 'todas',
  'qual', 'quais', 'quanto', 'quanta', 'quantos', 'quantas', 'onde', 'aonde', 'donde', 'como', 'porquê', 'porque', 'pois', 'porisso', 'portanto', 'então', 'logo',
  'apenas', 'tão', 'tão-somente', 'somente', 'apenas', 'só', 'acima', 'abaixo', 'dentro', 'fora', 'junto', 'longe', 'perto', 'aquém', 'além', 'através', 'sobre', 'sob',
  'ainda', 'já', 'agora', 'antes', 'depois', 'durante', 'enquanto', 'até', 'desde', 'contra', 'entre', 'para', 'por', 'sem', 'com', 'sob', 'sobre', 'trás', 'frente',
  'primeiro', 'segundo', 'terceiro', 'quarto', 'quinto', 'sexto', 'sétimo', 'oitavo', 'nono', 'décimo', 'último', 'próximo', 'anterior', 'posterior',
  'grande', 'pequeno', 'maior', 'menor', 'melhor', 'pior', 'bom', 'ruim', 'alto', 'baixo', 'longo', 'curto', 'grosso', 'fino', 'largo', 'estreito',
  'muito', 'pouco', 'mais', 'menos', 'demais', 'bastante', 'suficiente', 'excessivo', 'insuficiente', 'tanto', 'tão', 'quase', 'aproximadamente',
  'pode', 'poder', 'deve', 'dever', 'quer', 'quiser', 'precisa', 'precisar', 'vai', 'ir', 'vem', 'vir', 'fica', 'ficar', 'dá', 'dar', 'faz', 'fazer'
]);

// Subject-specific important terms that should be preserved
const SUBJECT_KEYWORDS = {
  ciencias: ['átomo', 'molécula', 'célula', 'tecido', 'órgão', 'sistema', 'organismo', 'ecossistema', 'habitat', 'espécie', 'evolução', 'genética', 'dna', 'rna', 'proteína', 'enzima', 'fotossíntese', 'respiração', 'digestão', 'circulação', 'excreção', 'reprodução', 'mitose', 'meiose', 'tecido', 'osso', 'músculo', 'cérebro', 'coração', 'pulmão', 'fígado', 'rim', 'estômago', 'intestino', 'bactéria', 'vírus', 'fungo', 'protozoário', 'alga', 'planta', 'animal', 'mamífero', 'réptil', 'ave', 'peixe', 'anfíbio', 'inseto', 'artrópode', 'molusco', 'equinoderme', 'porífera', 'cnidário', 'platelminto', 'nemátodo', 'anelídeo', 'cordado', 'vertebrado', 'invertebrado', 'química', 'física', 'biologia', 'geologia', 'astronomia', 'meteorologia', 'climatologia', 'oceanografia', 'hidrologia', 'botânica', 'zoologia', 'ecologia', 'genética', 'evolução', 'paleontologia', 'antropologia', 'psicologia', 'sociologia', 'economia', 'geografia', 'história', 'filosofia', 'literatura', 'arte', 'música', 'teatro', 'cinema', 'fotografia', 'escultura', 'pintura', 'desenho', 'arquitetura', 'engenharia', 'tecnologia', 'informática', 'matemática', 'estatística', 'probabilidade', 'álgebra', 'geometria', 'trigonometria', 'cálculo', 'aritmética', 'lógica', 'conjuntos', 'funções', 'equações', 'inequações', 'gráficos', 'tabelas', 'diagramas', 'mapas', 'planos', 'projetos', 'experimentos', 'observações', 'medidas', 'unidades', 'escalas', 'proporções', 'percentagens', 'frações', 'decimais', 'números', 'operações', 'cálculos', 'fórmulas', 'teoremas', 'axiomas', 'postulados', 'demonstrações', 'provas', 'hipóteses', 'teorias', 'leis', 'princípios', 'conceitos', 'definições', 'classificações', 'categorias', 'tipos', 'espécies', 'gêneros', 'famílias', 'ordens', 'classes', 'filos', 'reinos', 'domínios'],
  historia: ['guerra', 'paz', 'revolução', 'império', 'reino', 'república', 'monarquia', 'ditadura', 'democracia', 'colonização', 'independência', 'escravidão', 'abolição', 'industrialização', 'urbanização', 'globalização', 'capitalismo', 'socialismo', 'comunismo', 'fascismo', 'nazismo', 'guerra-fria', 'primeira-guerra', 'segunda-guerra', 'guerra-civil', 'revolução-industrial', 'revolução-francesa', 'revolução-americana', 'revolução-russa', 'revolução-chinesa', 'descobrimento', 'conquista', 'exploração', 'navegação', 'colonização', 'imigração', 'emigração', 'migração', 'comércio', 'troca', 'escambo', 'moeda', 'economia', 'política', 'sociedade', 'cultura', 'religião', 'filosofia', 'arte', 'literatura', 'música', 'arquitetura', 'escultura', 'pintura', 'renascimento', 'barroco', 'neoclassicismo', 'romantismo', 'realismo', 'impressionismo', 'modernismo', 'pós-modernismo', 'contemporâneo', 'antiguidade', 'idade-média', 'idade-moderna', 'idade-contemporânea', 'pré-história', 'história', 'arqueologia', 'antropologia', 'sociologia', 'geografia', 'cartografia', 'toponímia', 'cronologia', 'genealogia', 'heráldica', 'numismática', 'filatelia', 'museologia', 'patrimônio', 'monumento', 'ruína', 'sítio', 'escavação', 'artefato', 'fóssil', 'documento', 'manuscrito', 'arquivo', 'biblioteca', 'museu', 'exposição', 'coleção', 'catálogo', 'inventário', 'registro', 'pesquisa', 'estudo', 'análise', 'interpretação', 'contexto', 'fonte', 'testemunho', 'evidência', 'prova', 'argumento', 'tese', 'hipótese', 'teoria', 'modelo', 'paradigma', 'conceito', 'definição', 'classificação', 'tipologia', 'periodização', 'cronologia', 'sequência', 'sucessão', 'continuidade', 'mudança', 'transformação', 'evolução', 'desenvolvimento', 'progresso', 'declínio', 'crise', 'conflito', 'acordo', 'tratado', 'aliança', 'pacto', 'contrato', 'lei', 'decreto', 'regulamento', 'norma', 'regra', 'costume', 'tradição', 'inovação', 'reforma', 'modernização', 'conservação', 'preservação', 'restauração', 'reconstrução'],
  geografia: ['continente', 'país', 'estado', 'cidade', 'município', 'distrito', 'região', 'território', 'fronteira', 'limite', 'capital', 'metrópole', 'megalópole', 'conurbação', 'área-metropolitana', 'periferia', 'subúrbio', 'bairro', 'rua', 'avenida', 'praça', 'parque', 'jardim', 'floresta', 'selva', 'mata', 'cerrado', 'pantanal', 'caatinga', 'campina', 'campo', 'savana', 'estepe', 'deserto', 'tundra', 'taiga', 'floresta-tropical', 'floresta-temperada', 'floresta-boreal', 'manguezal', 'recife', 'atol', 'ilha', 'arquipélago', 'península', 'cabo', 'golfo', 'baía', 'estuário', 'delta', 'foz', 'nascente', 'cachoeira', 'cascata', 'rapidez', 'corredeira', 'lago', 'lagoa', 'represa', 'barragem', 'aqueduto', 'canal', 'rio', 'ribeirão', 'córrego', 'igarapé', 'várzea', 'planície', 'planalto', 'montanha', 'serra', 'cordilheira', 'pico', 'cume', 'monte', 'colina', 'morro', 'outeiro', 'chapada', 'chapadão', 'depressão', 'vale', 'cânion', 'gruta', 'caverna', 'abismo', 'precipício', 'penhasco', 'falésia', 'duna', 'praia', 'costa', 'litoral', 'litoral', 'orla', 'mar', 'oceano', 'continental', 'placa-tectônica', 'terremoto', 'vulcão', 'erupção', 'lava', 'magma', 'rocha', 'mineral', 'minério', 'petróleo', 'gás-natural', 'carvão', 'energia', 'recurso-natural', 'recurso-renovável', 'recurso-não-renovável', 'meio-ambiente', 'ecologia', 'poluição', 'contaminação', 'degradação', 'desmatamento', 'queimada', 'erosão', 'assoreamento', 'desertificação', 'aquecimento-global', 'efeito-estufa', 'buraco-na-camada-de-ozônio', 'chuva-ácida', 'inversão-térmica', 'ilhas-de-calor', 'clima', 'tempo', 'meteorologia', 'estação-do-ano', 'equinócio', 'solstício', 'fusos-horários', 'meridiano', 'paralelo', 'latitude', 'longitude', 'coordenada', 'altitude', 'elevação', 'relevo', 'hidrografia', 'vegetação', 'fauna', 'flora', 'biodiversidade', 'bioma', 'ecossistema', 'habitat', 'niche-ecológico', 'cadeia-alimentar', 'teia-alimentar', 'produtor', 'consumidor', 'decompositor', 'predador', 'presa', 'parasita', 'hospedeiro', 'simbiose', 'mutualismo', 'comensalismo', 'competição', 'cooperação', 'adaptação', 'evolução', 'seleção-natural', 'extinção', 'especiação', 'migração', 'nomadismo', 'sedentarização', 'urbanização', 'industrialização', 'globalização', 'regionalização', 'zoneamento', 'planejamento', 'desenvolvimento-sustentável', 'economia', 'comércio', 'turismo', 'transporte', 'comunicação', 'tecnologia', 'informação', 'satélite', 'gps', 'sensoriamento-remoto', 'mapeamento', 'cartografia', 'topografia', 'geoprocessamento', 'sistema-de-informação-geográfica', 'sig', 'georreferenciamento', 'geodésia', 'toponímia', 'geopolítica', 'geoeconomia', 'geossistema', 'paisagem', 'território', 'lugar', 'espaço', 'escala', 'região', 'rede', 'fluxo', 'conexão', 'integração', 'fronteira', 'limite', 'soberania', 'nação', 'estado-nação', 'identidade', 'cultura', 'sociedade', 'população', 'demografia', 'censo', 'densidade-demográfica', 'taxa-de-natalidade', 'taxa-de-mortalidade', 'taxa-de-fecundidade', 'expectativa-de-vida', 'envelhecimento', 'juventude', 'imigração', 'emigração', 'migração-interna', 'migração-externa', 'refugiado', 'asilo', 'xenofobia', 'racismo', 'discriminação', 'desigualdade', 'pobreza', 'exclusão-social', 'inclusão-social', 'direitos-humanos', 'cidadania', 'participação', 'democracia', 'representação', 'poder', 'governo', 'administração-pública', 'política', 'ideologia', 'partido', 'eleição', 'voto', 'sufrágio', 'mandato', 'legislação', 'justiça', 'segurança-pública', 'defesa', 'exército', 'marinha', 'aeronáutica', 'polícia', 'bombeiro', 'saúde-pública', 'educação', 'cultura', 'esporte', 'lazer', 'turismo', 'lazer', 'qualidade-de-vida', 'desenvolvimento-humano', 'índice-de-desenvolvimento-humano', 'idh'],
  matematica: ['número', 'inteiro', 'natural', 'racional', 'irracional', 'real', 'complexo', 'primo', 'composto', 'par', 'ímpar', 'positivo', 'negativo', 'zero', 'unidade', 'dezena', 'centena', 'milhar', 'milhão', 'trilhão', 'algarismo', 'dígito', 'cifra', 'valor-posicional', 'sistema-de-numeração', 'decimal', 'binário', 'octal', 'hexadecimal', 'romano', 'adição', 'soma', 'total', 'subtração', 'diferença', 'resto', 'multiplicação', 'produto', 'vezes', 'divisão', 'quociente', 'resto', 'fração', 'numerador', 'denominador', 'mista', 'própria', 'imprópria', 'decimal', 'porcentagem', 'taxa', 'juro', 'simples', 'composto', 'proporção', 'razão', 'regra-de-três', 'direta', 'inversa', 'composta', 'medida', 'comprimento', 'metro', 'centímetro', 'milímetro', 'quilômetro', 'polegada', 'pé', 'jarda', 'milha', 'área', 'metro-quadrado', 'hectare', 'acre', 'volume', 'metro-cúbico', 'litro', 'mililitro', 'massa', 'grama', 'quilograma', 'tonelada', 'tempo', 'segundo', 'minuto', 'hora', 'dia', 'semana', 'mês', 'ano', 'década', 'século', 'milênio', 'ângulo', 'grau', 'radiano', 'grau-minuto', 'grau-segundo', 'triângulo', 'equilátero', 'isósceles', 'escaleno', 'retângulo', 'acutângulo', 'obtusângulo', 'quadrado', 'retângulo', 'losango', 'paralelogramo', 'trapézio', 'círculo', 'circunferência', 'raio', 'diâmetro', 'corda', 'arco', 'setor', 'segmento-circular', 'polígono', 'pentágono', 'hexágono', 'heptágono', 'octógono', 'eneágono', 'decágono', 'regular', 'irregular', 'convexo', 'não-convexo', 'perímetro', 'área', 'apótema', 'diagonal', 'altura', 'base', 'vértice', 'lado', 'geometria', 'plana', 'espacial', 'sólido', 'poliedro', 'tetraedro', 'hexaedro', 'cubo', 'octaedro', 'dodecaedro', 'icosaedro', 'prisma', 'pirâmide', 'cilindro', 'cone', 'esfera', 'superfície', 'volume', 'área-lateral', 'área-total', 'fórmula', 'teorema', 'pitágoras', 'tales', 'euclides', 'álgebra', 'variável', 'incógnita', 'equação', 'primeiro-grau', 'segundo-grau', 'terceiro-grau', 'quarto-grau', 'sistema', 'linear', 'não-linear', 'função', 'domínio', 'contradomínio', 'imagem', 'gráfico', 'reta', 'parábola', 'hipérbole', 'elipse', 'exponencial', 'logarítmica', 'trigonométrica', 'seno', 'cosseno', 'tangente', 'cotangente', 'secante', 'cossecante', 'arco-seno', 'arco-cosseno', 'arco-tangente', 'identidade', 'ângulo', 'agudo', 'reto', 'obtuso', 'complementar', 'suplementar', 'oposto-pelo-vértice', 'alternos-internos', 'alternos-externos', 'correspondentes', 'colineares', 'concorrentes', 'paralelas', 'perpendiculares', 'perpendicularismo', 'paralelismo', 'simetria', 'rotação', 'translação', 'reflexão', 'homotetia', 'semelhança', 'congruência', 'razão', 'proporção', 'escala', 'ampliação', 'redução', 'estatística', 'dados', 'tabela', 'gráfico', 'coluna', 'barra', 'linha', 'setor', 'dispersão', 'frequência', 'absoluta', 'relativa', 'acumulada', 'média', 'mediana', 'moda', 'desvio-padrão', 'variância', 'amplitude', 'quartil', 'decil', 'percentil', 'probabilidade', 'evento', 'certo', 'impossível', 'favorável', 'desfavorável', 'espaço-amostral', 'experimento', 'aleatório', 'combinação', 'arranjo', 'permutação', 'fatorial', 'binômio', 'newton', 'pascal', 'progressão', 'aritmética', 'geométrica', 'razão', 'termo', 'soma', 'infinita', 'matriz', 'ordem', 'linha', 'coluna', 'elemento', 'diagonal-principal', 'diagonal-secundária', 'determinante', 'inversa', 'transposta', 'vetor', 'magnitude', 'direção', 'sentido', 'escalar', 'produto-interno', 'produto-vetorial', 'produto-misto', 'cálculo', 'diferencial', 'integral', 'limite', 'derivada', 'integral-definida', 'integral-indefinida', 'função', 'composta', 'inversa', 'taxa-de-variação', 'máximo', 'mínimo', 'ponto-crítico', 'concavidade', 'ponto-de-inflexão', 'assíntota', 'horizontal', 'vertical', 'oblíqua', 'número-complexo', 'parte-real', 'parte-imaginária', 'módulo', 'argumento', 'forma-trigonométrica', 'forma-exponencial', 'plano-complexo', 'raiz', 'unidade-imaginária', 'conjugado', 'equação', 'polinomial', 'coeficiente', 'grau', 'raiz', 'multiplicidade', 'fatoração', 'teorema-fundamental', 'álgebra', 'booleana', 'conjunto', 'união', 'intersecção', 'diferença', 'complementar', 'subconjunto', 'pertence', 'não-pertence', 'contém', 'não-contém', 'vazio', 'universal', 'disjunto', 'lógica', 'proposição', 'verdadeiro', 'falso', 'conectivo', 'negação', 'conjunção', 'disjunção', 'condicional', 'bicondicional', 'tabela-verdade', 'equivalência', 'contradição', 'tautologia', 'silogismo', 'premissa', 'conclusão', 'argumento', 'válido', 'inválido', 'indução', 'dedução', 'paradoxo']
};

/**
 * Extracts keywords from a question prompt
 * @param prompt The question prompt text
 * @param subject Optional subject to prioritize relevant keywords
 * @returns Array of relevant keywords
 */
export function extractKeywords(prompt: string, subject?: string): string[] {
  // Convert to lowercase and remove punctuation
  const cleanText = prompt
    .toLowerCase()
    .replace(/[.,;:!?'"()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Split into words
  const words = cleanText.split(' ');

  // Filter out stop words and short words (less than 3 characters)
  const filteredWords = words.filter(word => 
    word.length >= 3 && 
    !PORTUGUESE_STOP_WORDS.has(word) &&
    !/^\d+$/.test(word) // Remove pure numbers
  );

  // If subject is provided, prioritize subject-specific keywords
  let prioritizedWords = filteredWords;
  if (subject) {
    const subjectLower = subject.toLowerCase();
    const subjectKeywords = SUBJECT_KEYWORDS[subjectLower as keyof typeof SUBJECT_KEYWORDS];
    if (subjectKeywords) {
      prioritizedWords = filteredWords.map(word => {
        // Check if word matches or is part of a subject keyword
        const isSubjectKeyword = subjectKeywords.some((keyword: string) =>
          keyword.includes(word) || word.includes(keyword)
        );
        return isSubjectKeyword ? word : word;
      });
    }
  }

  // Remove duplicates and return
  return [...new Set(prioritizedWords)];
}

/**
 * Generates an image prompt from keywords
 * @param keywords Array of keywords
 * @param questionType Type of question to guide the image style
 * @returns Image prompt string
 */
export function generateImagePrompt(keywords: string[], questionType?: string): string {
  if (keywords.length === 0) {
    return 'simple educational diagram';
  }

  // Take most relevant keywords (first 2-3 to keep it simple)
  const mainKeywords = keywords.slice(0, Math.min(3, keywords.length));
  
  // Simple style modifiers for better Pollinations results
  let styleModifier = 'simple educational diagram';
  switch (questionType) {
    case 'mcq':
    case 'truefalse':
      styleModifier = 'simple educational diagram, clear, minimal';
      break;
    case 'short':
    case 'gapfill':
    case 'essay':
      styleModifier = 'educational concept, simple illustration';
      break;
    case 'matching':
      styleModifier = 'educational chart, simple comparison';
      break;
    case 'ordering':
      styleModifier = 'process diagram, sequential steps, clean arrows';
      break;
    default:
      styleModifier = 'simple educational diagram';
  }

  // Create a simpler, more effective prompt
  const prompt = `${mainKeywords.join(' ')}, ${styleModifier}, white background, simple, clear`;
  
  return prompt;
}

/**
 * Extracts keywords and generates an image prompt in one step
 * @param prompt The question prompt text
 * @param subject Optional subject to prioritize relevant keywords
 * @param questionType Type of question to guide the image style
 * @returns Image prompt string
 */
export function createImagePromptFromQuestion(prompt: string, subject?: string, questionType?: string): string {
  const keywords = extractKeywords(prompt, subject);
  return generateImagePrompt(keywords, questionType);
}
