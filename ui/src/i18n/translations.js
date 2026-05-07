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
      'Upload local videos, choose the exact time range to process, split it into custom clips, apply a crop preset, and monitor progress in a compact batch queue.',
    languageLabel: 'Language',
    filesTitle: 'Files',
    filesHint: 'Select one or more videos to process in a local queue.',
    selectVideos: 'Select videos',
    noFilesSelected: 'No files selected.',
    settingsTitle: 'Settings',
    settingsHint: 'Choose a crop preset, segment length, and the exact range to process for the selected file.',
    settingsEmpty: 'Select at least one file to configure trimming and splitting.',
    editRangeAction: 'Edit range',
    cropLabel: 'Crop',
    cropInfo: 'Pick the output framing preset for generated clips. Drag the preview frame to reposition it with snap-to-edge and center guides.',
    durationLabel: 'Segment duration (seconds)',
    durationInfoChunk: 'Target length for each output clip inside the selected range.',
    rangeEditorTitle: 'Selected range',
    rangeEditorHint: 'Use the manual time fields or sliders to define the exact portion of the video to process.',
    rangeMetricsLabel: 'Range summary',
    totalDurationLabel: 'Total duration',
    startTimeLabel: 'Start time',
    endTimeLabel: 'End time',
    selectedDurationLabel: 'Selected duration',
    timelineLabel: 'Timeline',
    startSliderLabel: 'Start timeline handle',
    endSliderLabel: 'End timeline handle',
    startProcessing: 'Start processing',
    queueTitle: 'Queue',
    queueHint: 'Each file is processed sequentially so one failure does not stop the rest.',
    queueEmpty: 'Your processing queue will appear here.',
    previewTitle: 'Preview',
    previewHint: 'Preview uses the local file and does not wait for backend processing.',
    previewEmpty: 'Select a file to preview it here.',
    previewPlaybackLabel: 'Preview playback',
    previewSeekLabel: 'Preview seek control',
    playPreview: 'Play preview',
    pausePreview: 'Pause preview',
    statusTitle: 'Status',
    statusEmpty: 'Upload files to create a processing queue.',
    statusMetrics: {
      completed: 'Completed',
      failed: 'Failed',
      remaining: 'Remaining',
    },
    outputsTitle: 'Outputs',
    openOutput: 'Open output',
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
      'Splitting selected range into chunks.': 'Splitting selected range into chunks.',
      'Collecting generated output files.': 'Collecting generated output files.',
      'Processing completed.': 'Processing completed.',
      'Processing failed.': 'Processing failed.',
      'Waiting to start.': 'Waiting to start.',
    },
    errorMessages: {
      'Unsupported crop mode.': 'Unsupported crop mode.',
      'Filename is required.': 'Filename is required.',
      'Duration must be positive.': 'Duration must be positive.',
      'Crop position must be zero or greater.': 'Crop position must be zero or greater.',
      'Start time must be zero or greater.': 'Start time must be zero or greater.',
      'End time must be greater than start time.': 'End time must be greater than start time.',
      'Job not found.': 'Job not found.',
      'OpenCV is not installed.': 'OpenCV is not installed.',
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
      'Загружай локальные видео, выбирай точный диапазон обработки, режь его на клипы нужной длины, применяй crop и отслеживай прогресс в компактной очереди.',
    languageLabel: 'Язык',
    filesTitle: 'Файлы',
    filesHint: 'Выбери один или несколько роликов для обработки в локальной очереди.',
    selectVideos: 'Выбрать видео',
    noFilesSelected: 'Файлы не выбраны.',
    settingsTitle: 'Настройки',
    settingsHint: 'Выбери crop, длину сегмента и точный диапазон для выбранного файла.',
    settingsEmpty: 'Выбери хотя бы один файл, чтобы настроить тримминг и нарезку.',
    editRangeAction: 'Редактировать диапазон',
    cropLabel: 'Crop',
    cropInfo: 'Выбери формат кадрирования для готовых клипов. Перетаскивай рамку в превью, она примагничивается к краям и центру кадра.',
    durationLabel: 'Длина сегмента (секунды)',
    durationInfoChunk: 'Целевая длина каждого выходного клипа внутри выбранного диапазона.',
    rangeEditorTitle: 'Выбранный диапазон',
    rangeEditorHint: 'Используй ручной ввод времени или слайдеры, чтобы задать точную часть видео для обработки.',
    rangeMetricsLabel: 'Сводка диапазона',
    totalDurationLabel: 'Общая длительность',
    startTimeLabel: 'Время старта',
    endTimeLabel: 'Время конца',
    selectedDurationLabel: 'Длительность диапазона',
    timelineLabel: 'Таймлайн',
    startSliderLabel: 'Ползунок начала таймлайна',
    endSliderLabel: 'Ползунок конца таймлайна',
    startProcessing: 'Начать обработку',
    queueTitle: 'Очередь',
    queueHint: 'Каждый файл обрабатывается последовательно, поэтому одна ошибка не ломает остальные.',
    queueEmpty: 'Очередь обработки появится здесь.',
    previewTitle: 'Превью',
    previewHint: 'Превью использует локальный файл и не ждет backend обработку.',
    previewEmpty: 'Выбери файл, чтобы увидеть превью.',
    previewPlaybackLabel: 'Управление превью',
    previewSeekLabel: 'Ползунок перемотки превью',
    playPreview: 'Воспроизвести',
    pausePreview: 'Пауза',
    statusTitle: 'Статус',
    statusEmpty: 'Загрузи файлы, чтобы создать очередь обработки.',
    statusMetrics: {
      completed: 'Завершено',
      failed: 'С ошибкой',
      remaining: 'Осталось',
    },
    outputsTitle: 'Результаты',
    openOutput: 'Открыть файл',
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
      'Splitting selected range into chunks.': 'Нарезка выбранного диапазона на клипы.',
      'Collecting generated output files.': 'Сбор готовых файлов.',
      'Processing completed.': 'Обработка завершена.',
      'Processing failed.': 'Обработка завершилась ошибкой.',
      'Waiting to start.': 'Ожидание запуска.',
    },
    errorMessages: {
      'Unsupported crop mode.': 'Неподдерживаемый режим crop.',
      'Filename is required.': 'Требуется имя файла.',
      'Duration must be positive.': 'Длительность должна быть положительной.',
      'Crop position must be zero or greater.': 'Позиция crop должна быть не меньше нуля.',
      'Start time must be zero or greater.': 'Время старта должно быть не меньше нуля.',
      'End time must be greater than start time.': 'Время конца должно быть больше времени старта.',
      'Job not found.': 'Задача не найдена.',
      'OpenCV is not installed.': 'OpenCV не установлен.',
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
      'Завантажуй локальні відео, обирай точний діапазон обробки, ріж його на кліпи потрібної довжини, застосовуй crop і стеж за прогресом у компактній черзі.',
    languageLabel: 'Мова',
    filesTitle: 'Файли',
    filesHint: 'Обери один або кілька роликів для обробки в локальній черзі.',
    selectVideos: 'Обрати відео',
    noFilesSelected: 'Файли не вибрані.',
    settingsTitle: 'Налаштування',
    settingsHint: 'Обери crop, довжину сегмента й точний діапазон для вибраного файла.',
    settingsEmpty: 'Обери хоча б один файл, щоб налаштувати тримінг і нарізку.',
    editRangeAction: 'Редагувати діапазон',
    cropLabel: 'Crop',
    cropInfo: 'Обери формат кадрування для готових кліпів. Перетягуй рамку в превʼю, вона примагнічується до країв і центру кадру.',
    durationLabel: 'Довжина сегмента (секунди)',
    durationInfoChunk: 'Цільова довжина кожного вихідного кліпу всередині вибраного діапазону.',
    rangeEditorTitle: 'Вибраний діапазон',
    rangeEditorHint: 'Використовуй ручне введення часу або слайдери, щоб задати точну частину відео для обробки.',
    rangeMetricsLabel: 'Підсумок діапазону',
    totalDurationLabel: 'Загальна тривалість',
    startTimeLabel: 'Час старту',
    endTimeLabel: 'Час завершення',
    selectedDurationLabel: 'Тривалість діапазону',
    timelineLabel: 'Таймлайн',
    startSliderLabel: 'Повзунок початку таймлайна',
    endSliderLabel: 'Повзунок кінця таймлайна',
    startProcessing: 'Почати обробку',
    queueTitle: 'Черга',
    queueHint: 'Кожен файл обробляється послідовно, тому одна помилка не зупиняє решту.',
    queueEmpty: 'Черга обробки зʼявиться тут.',
    previewTitle: 'Превʼю',
    previewHint: 'Превʼю використовує локальний файл і не чекає на backend обробку.',
    previewEmpty: 'Обери файл, щоб побачити превʼю.',
    previewPlaybackLabel: 'Керування превʼю',
    previewSeekLabel: 'Повзунок перемотування превʼю',
    playPreview: 'Відтворити',
    pausePreview: 'Пауза',
    statusTitle: 'Статус',
    statusEmpty: 'Завантаж файли, щоб створити чергу обробки.',
    statusMetrics: {
      completed: 'Завершено',
      failed: 'З помилкою',
      remaining: 'Залишилось',
    },
    outputsTitle: 'Результати',
    openOutput: 'Відкрити файл',
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
      'Splitting selected range into chunks.': 'Нарізка вибраного діапазону на кліпи.',
      'Collecting generated output files.': 'Збір готових файлів.',
      'Processing completed.': 'Обробку завершено.',
      'Processing failed.': 'Обробка завершилась помилкою.',
      'Waiting to start.': 'Очікування запуску.',
    },
    errorMessages: {
      'Unsupported crop mode.': 'Непідтримуваний режим crop.',
      'Filename is required.': 'Потрібна назва файлу.',
      'Duration must be positive.': 'Тривалість має бути додатною.',
      'Crop position must be zero or greater.': 'Позиція crop має бути не меншою за нуль.',
      'Start time must be zero or greater.': 'Час старту має бути не меншим за нуль.',
      'End time must be greater than start time.': 'Час завершення має бути більшим за час старту.',
      'Job not found.': 'Завдання не знайдено.',
      'OpenCV is not installed.': 'OpenCV не встановлено.',
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
