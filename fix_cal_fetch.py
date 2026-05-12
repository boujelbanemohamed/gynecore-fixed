filepath = 'frontend/src/pages/secretary/Calendar.tsx'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    "setUnavailSlots(resU.data.data || [])",
    "setUnavailSlots(resU.data.data?.slots || [])"
)

with open(filepath, 'w') as f:
    f.write(content)
print('Done')
