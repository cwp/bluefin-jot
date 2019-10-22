export const level = {
  none: 0,
  debug: 1,
  info: 2,
  warning: 3,
  error: 4,
  critical: 5,
  all: 6,
}

export const levelName = []
for (const name in level) levelName[level[name]] = name
