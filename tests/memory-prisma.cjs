// Test double only. Integration mode uses the generated Prisma client instead.
exports.createMemoryPrisma = function () {
  const state = { staffUser: [], auditLog: [], loginAttempt: [] };
  let queue = Promise.resolve();
  const matches = (row, where = {}) => Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(clause => matches(row, clause));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('in' in value) return value.in.includes(row[key]);
      if ('lt' in value) return row[key] < value.lt;
    }
    return row[key] === value;
  });
  const client = {};
  for (const table of Object.keys(state)) {
    client[table] = {
      async findMany({ where, orderBy, take } = {}) {
        let rows = state[table].filter(row => matches(row, where));
        if (orderBy) { const [field, direction] = Object.entries(orderBy)[0]; rows.sort((a, b) => (a[field] > b[field] ? 1 : -1) * (direction === 'desc' ? -1 : 1)); }
        if (take) rows = rows.slice(0, take);
        return structuredClone(rows);
      },
      async findUnique({ where }) { return structuredClone(state[table].find(row => matches(row, where)) ?? null); },
      async create({ data }) {
        if (state[table].some(row => row.id === data.id && data.id || row.email === data.email && data.email)) throw Error('unique conflict');
        const row = { ...(table === 'auditLog' ? { id: require('node:crypto').randomUUID(), at: new Date(), actorName: null, detail: null, ip: null } : {}), ...structuredClone(data) };
        state[table].push(row); return structuredClone(row);
      },
      async update({ where, data }) { const row = state[table].find(row => matches(row, where)); if (!row) throw Error('missing row'); Object.assign(row, structuredClone(data)); return structuredClone(row); },
      async upsert({ where, create, update }) { return state[table].some(row => matches(row, where)) ? this.update({ where, data: update }) : this.create({ data: create }); },
      async delete({ where }) { const index = state[table].findIndex(row => matches(row, where)); if (index === -1) throw Error('missing row'); return state[table].splice(index, 1)[0]; },
      async deleteMany({ where } = {}) { const before = state[table].length; state[table] = state[table].filter(row => !matches(row, where)); return { count: before - state[table].length }; },
      async updateMany({ data }) { for (const row of state[table]) Object.assign(row, data); return { count: state[table].length }; },
    };
  }
  client.$queryRaw = async () => [];
  client.$transaction = async fn => {
    const task = queue.then(async () => {
      const before = structuredClone(state);
      try { return await fn(client); }
      catch (error) { Object.assign(state, before); throw error; }
    });
    queue = task.catch(() => {});
    return task;
  };
  return client;
};
