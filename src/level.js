export const level = {
  all: Number.MIN_SAFE_INTEGER,
  debug: 10,
  info: 20,
  warning: 30,
  error: 40,
  critical: 50,
  none: Number.MAX_SAFE_INTEGER,
}

export const levelName = {}
for (const name in level) levelName[level[name]] = name
