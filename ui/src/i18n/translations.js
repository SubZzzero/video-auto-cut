import { CROP_MODE_VALUES } from '../config/constants'

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'ua', label: 'UA' },
  { value: 'ru', label: 'RU' },
]


// Select the correct Slavic plural form for one count.
function selectSlavicPluralForm(count, one, few, many) {
  const absoluteCount = Math.abs(count)
  const lastTwoDigits = absoluteCount % 100
  const lastDigit = absoluteCount % 10

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return many
  }

  if (lastDigit === 1) {
    return one
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return few
  }

  return many
}


// Build the English status summary line.
function buildEnglishStatusSummary(completed, failed, remaining) {
  return `${completed} completed, ${failed} failed, ${remaining} remaining.`
}


// Build the Russian status summary line.
function buildRussianStatusSummary(completed, failed, remaining) {
  return `${completed} завершено, ${failed} с ошибкой, ${remaining} осталось.`
}


// Build the Ukrainian status summary line.
function buildUkrainianStatusSummary(completed, failed, remaining) {
  return `${completed} завершено, ${failed} з помилкою, ${remaining} залишилось.`
}


// Build the English output count line.
function buildEnglishResultCount(count) {
  return `${count} file${count === 1 ? '' : 's'}`
}


// Build the Russian output count line.
function buildRussianResultCount(count) {
  return `${count} ${selectSlavicPluralForm(count, 'файл', 'файла', 'файлов')}`
}


// Build the Ukrainian output count line.
function buildUkrainianResultCount(count) {
  return `${count} ${selectSlavicPluralForm(count, 'файл', 'файли', 'файлів')}`
}


const translations = {
  en: {
    appTitle: 'Video Auto Cutter',
    appDescription:
      'Upload local videos, cut them into fixed-duration clips, apply a crop preset, and monitor progress in a compact batch queue.',
    languageLabel: 'Language',
    filesTitle: 'Files',
    filesHint: 'Select one or more videos to process in a local queue.',
    selectVideos: 'Select videos',
    noFilesSelected: 'No files selected.',
    settingsTitle: 'Settings',
    settingsHint: 'Choose a crop preset and the chunk duration before starting.',
    modeLabel: 'Mode',
    modeInfo: 'Choose how the source video should be split.',
    cropLabel: 'Crop',
    cropInfo: 'Pick the output framing preset for generated clips. Crops stay centered on the frame.',
    durationLabel: 'Duration (seconds)',
    durationInfoChunk: 'Target length for each output clip.',
    durationInfoScenes: 'Scene mode keeps detected boundaries. Duration is only used for chunk mode.',
    startProcessing: 'Start processing',
    queueTitle: 'Queue',
    queueHint: 'Each file is processed sequentially so one failure does not stop the rest.',
    queueEmpty: 'Your processing queue will appear here.',
    previewTitle: 'Preview',
    previewHint: 'Preview uses the local file and does not wait for backend processing.',
    previewEmpty: 'Select a file to preview it here.',
    statusTitle: 'Status',
    statusEmpty: 'Upload files to create a processing queue.',
    statusMetrics: {
      completed: 'Completed',
      failed: 'Failed',
      remaining: 'Remaining',
    },
    outputsTitle: 'Outputs',
    openOutput: 'Open output',
    processModes: {
      chunk: 'Fixed duration chunks',
      scenes: 'Scene detection',
    },
    cropModes: {
      none: 'No crop',
      vertical: 'Vertical 9:16',
      portrait_4_5: 'Portrait 4:5',
      square_1_1: 'Square 1:1',
      portrait_3_4: 'Portrait 3:4',
      horizontal: 'Horizontal 16:9',
    },
    screenStates: {
      idle: 'idle',
      loading: 'loading',
      success: 'success',
      error: 'error',
    },
    queueStates: {
      queued: 'queued',
      uploading: 'uploading',
      processing: 'processing',
      success: 'success',
      error: 'error',
    },
    runtimeMessages: {
      'Uploading file.': 'Uploading file.',
      'Job queued.': 'Job queued.',
      'Preparing video processing.': 'Preparing video processing.',
      'Splitting video into chunks.': 'Splitting video into chunks.',
      'Detecting scene boundaries.': 'Detecting scene boundaries.',
      'Splitting video by detected scenes.': 'Splitting video by detected scenes.',
      'Collecting generated output files.': 'Collecting generated output files.',
      'Processing completed.': 'Processing completed.',
      'Processing failed.': 'Processing failed.',
      'Waiting to start.': 'Waiting to start.',
    },
    errorMessages: {
      'Unsupported mode.': 'Unsupported mode.',
      'Unsupported crop mode.': 'Unsupported crop mode.',
      'Filename is required.': 'Filename is required.',
      'Duration must be positive.': 'Duration must be positive.',
      'Job not found.': 'Job not found.',
      'OpenCV is not installed.': 'OpenCV is not installed.',
      'PySceneDetect is not installed.': 'PySceneDetect is not installed.',
      'FFmpeg is not available on PATH.': 'FFmpeg is not available on PATH.',
      'Unable to read the first frame from the uploaded video.': 'Unable to read the first frame from the uploaded video.',
      'Unable to determine the video duration.': 'Unable to determine the video duration.',
      'No output files were generated.': 'No output files were generated.',
      'An unexpected error occurred.': 'An unexpected error occurred.',
    },
    formatStatusSummary: buildEnglishStatusSummary,
    formatResultCount: buildEnglishResultCount,
  },
  ru: {
    appTitle: 'Video Auto Cutter',
    appDescription:
      'Загружай локальные видео, режь их на клипы фиксированной длины, применяй crop и отслеживай прогресс в компактной очереди.',
    languageLabel: 'Язык',
    filesTitle: 'Файлы',
    filesHint: 'Выбери один или несколько роликов для обработки в локальной очереди.',
    selectVideos: 'Выбрать видео',
    noFilesSelected: 'Файлы не выбраны.',
    settingsTitle: 'Настройки',
    settingsHint: 'Выбери crop и длительность чанка перед запуском.',
    modeLabel: 'Режим',
    modeInfo: 'Выбери, как нужно разрезать исходное видео.',
    cropLabel: 'Crop',
    cropInfo: 'Выбери формат кадрирования для готовых клипов. Crop остается по центру кадра.',
    durationLabel: 'Длительность (секунды)',
    durationInfoChunk: 'Целевая длина каждого выходного клипа.',
    durationInfoScenes: 'Режим сцен сохраняет найденные границы. Длительность используется только для чанков.',
    startProcessing: 'Начать обработку',
    queueTitle: 'Очередь',
    queueHint: 'Каждый файл обрабатывается последовательно, поэтому одна ошибка не ломает остальные.',
    queueEmpty: 'Очередь обработки появится здесь.',
    previewTitle: 'Превью',
    previewHint: 'Превью использует локальный файл и не ждет backend обработку.',
    previewEmpty: 'Выбери файл, чтобы увидеть превью.',
    statusTitle: 'Статус',
    statusEmpty: 'Загрузи файлы, чтобы создать очередь обработки.',
    statusMetrics: {
      completed: 'Завершено',
      failed: 'С ошибкой',
      remaining: 'Осталось',
    },
    outputsTitle: 'Результаты',
    openOutput: 'Открыть файл',
    processModes: {
      chunk: 'Клипы фиксированной длины',
      scenes: 'Определение сцен',
    },
    cropModes: {
      none: 'Без crop',
      vertical: 'Вертикальный 9:16',
      portrait_4_5: 'Портретный 4:5',
      square_1_1: 'Квадратный 1:1',
      portrait_3_4: 'Портретный 3:4',
      horizontal: 'Горизонтальный 16:9',
    },
    screenStates: {
      idle: 'ожидание',
      loading: 'обработка',
      success: 'готово',
      error: 'ошибка',
    },
    queueStates: {
      queued: 'в очереди',
      uploading: 'загрузка',
      processing: 'обработка',
      success: 'готово',
      error: 'ошибка',
    },
    runtimeMessages: {
      'Uploading file.': 'Загрузка файла.',
      'Job queued.': 'Задача добавлена в очередь.',
      'Preparing video processing.': 'Подготовка обработки видео.',
      'Splitting video into chunks.': 'Нарезка видео на клипы.',
      'Detecting scene boundaries.': 'Определение границ сцен.',
      'Splitting video by detected scenes.': 'Нарезка видео по найденным сценам.',
      'Collecting generated output files.': 'Сбор готовых файлов.',
      'Processing completed.': 'Обработка завершена.',
      'Processing failed.': 'Обработка завершилась ошибкой.',
      'Waiting to start.': 'Ожидание запуска.',
    },
    errorMessages: {
      'Unsupported mode.': 'Неподдерживаемый режим.',
      'Unsupported crop mode.': 'Неподдерживаемый режим crop.',
      'Filename is required.': 'Требуется имя файла.',
      'Duration must be positive.': 'Длительность должна быть положительной.',
      'Job not found.': 'Задача не найдена.',
      'OpenCV is not installed.': 'OpenCV не установлен.',
      'PySceneDetect is not installed.': 'PySceneDetect не установлен.',
      'FFmpeg is not available on PATH.': 'FFmpeg недоступен в PATH.',
      'Unable to read the first frame from the uploaded video.': 'Не удалось прочитать первый кадр загруженного видео.',
      'Unable to determine the video duration.': 'Не удалось определить длительность видео.',
      'No output files were generated.': 'Не удалось создать выходные файлы.',
      'An unexpected error occurred.': 'Произошла непредвиденная ошибка.',
    },
    formatStatusSummary: buildRussianStatusSummary,
    formatResultCount: buildRussianResultCount,
  },
  ua: {
    appTitle: 'Video Auto Cutter',
    appDescription:
      'Завантажуй локальні відео, ріж їх на кліпи фіксованої довжини, застосовуй crop і стеж за прогресом у компактній черзі.',
    languageLabel: 'Мова',
    filesTitle: 'Файли',
    filesHint: 'Обери один або кілька роликів для обробки в локальній черзі.',
    selectVideos: 'Обрати відео',
    noFilesSelected: 'Файли не вибрані.',
    settingsTitle: 'Налаштування',
    settingsHint: 'Обери crop і тривалість чанку перед запуском.',
    modeLabel: 'Режим',
    modeInfo: 'Обери, як потрібно розрізати вихідне відео.',
    cropLabel: 'Crop',
    cropInfo: 'Обери формат кадрування для готових кліпів. Crop залишається по центру кадру.',
    durationLabel: 'Тривалість (секунди)',
    durationInfoChunk: 'Цільова довжина кожного вихідного кліпу.',
    durationInfoScenes: 'Режим сцен зберігає знайдені межі. Тривалість використовується лише для чанків.',
    startProcessing: 'Почати обробку',
    queueTitle: 'Черга',
    queueHint: 'Кожен файл обробляється послідовно, тому одна помилка не зупиняє решту.',
    queueEmpty: 'Черга обробки зʼявиться тут.',
    previewTitle: 'Превʼю',
    previewHint: 'Превʼю використовує локальний файл і не чекає на backend обробку.',
    previewEmpty: 'Обери файл, щоб побачити превʼю.',
    statusTitle: 'Статус',
    statusEmpty: 'Завантаж файли, щоб створити чергу обробки.',
    statusMetrics: {
      completed: 'Завершено',
      failed: 'З помилкою',
      remaining: 'Залишилось',
    },
    outputsTitle: 'Результати',
    openOutput: 'Відкрити файл',
    processModes: {
      chunk: 'Кліпи фіксованої довжини',
      scenes: 'Визначення сцен',
    },
    cropModes: {
      none: 'Без crop',
      vertical: 'Вертикальний 9:16',
      portrait_4_5: 'Портретний 4:5',
      square_1_1: 'Квадратний 1:1',
      portrait_3_4: 'Портретний 3:4',
      horizontal: 'Горизонтальний 16:9',
    },
    screenStates: {
      idle: 'очікування',
      loading: 'обробка',
      success: 'готово',
      error: 'помилка',
    },
    queueStates: {
      queued: 'у черзі',
      uploading: 'завантаження',
      processing: 'обробка',
      success: 'готово',
      error: 'помилка',
    },
    runtimeMessages: {
      'Uploading file.': 'Завантаження файлу.',
      'Job queued.': 'Завдання додано до черги.',
      'Preparing video processing.': 'Підготовка обробки відео.',
      'Splitting video into chunks.': 'Нарізка відео на кліпи.',
      'Detecting scene boundaries.': 'Визначення меж сцен.',
      'Splitting video by detected scenes.': 'Нарізка відео за знайденими сценами.',
      'Collecting generated output files.': 'Збір готових файлів.',
      'Processing completed.': 'Обробку завершено.',
      'Processing failed.': 'Обробка завершилась помилкою.',
      'Waiting to start.': 'Очікування запуску.',
    },
    errorMessages: {
      'Unsupported mode.': 'Непідтримуваний режим.',
      'Unsupported crop mode.': 'Непідтримуваний режим crop.',
      'Filename is required.': 'Потрібна назва файлу.',
      'Duration must be positive.': 'Тривалість має бути додатною.',
      'Job not found.': 'Завдання не знайдено.',
      'OpenCV is not installed.': 'OpenCV не встановлено.',
      'PySceneDetect is not installed.': 'PySceneDetect не встановлено.',
      'FFmpeg is not available on PATH.': 'FFmpeg недоступний у PATH.',
      'Unable to read the first frame from the uploaded video.': 'Не вдалося прочитати перший кадр завантаженого відео.',
      'Unable to determine the video duration.': 'Не вдалося визначити тривалість відео.',
      'No output files were generated.': 'Не вдалося створити вихідні файли.',
      'An unexpected error occurred.': 'Сталася непередбачена помилка.',
    },
    formatStatusSummary: buildUkrainianStatusSummary,
    formatResultCount: buildUkrainianResultCount,
  },
}


// Return a copy dictionary for one selected language.
export function getTranslation(language) {
  return translations[language] ?? translations.en
}
// Build translated crop options for the settings form.
export function getCropOptions(copy) {
  return CROP_MODE_VALUES.map((value) => ({ value, label: copy.cropModes[value] }))
}


// Translate one global screen state label.
export function translateScreenState(state, copy) {
  return copy.screenStates[state] ?? state
}


// Translate one queue item status label.
export function translateQueueState(state, copy) {
  return copy.queueStates[state] ?? state
}


// Translate one runtime message emitted by the UI or backend.
export function translateRuntimeMessage(message, copy) {
  return copy.runtimeMessages[message] ?? message
}


// Translate one backend or client error message.
export function translateErrorMessage(message, copy) {
  return copy.errorMessages[message] ?? message
}


// Format the queue summary line for the selected language.
export function formatStatusSummary(copy, completed, failed, remaining) {
  return copy.formatStatusSummary(completed, failed, remaining)
}


// Format the output count for the selected language.
export function formatResultCount(copy, count) {
  return copy.formatResultCount(count)
}
