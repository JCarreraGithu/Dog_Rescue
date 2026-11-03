// Test double only. Integration mode uses the generated Prisma client instead.
exports.createMemoryPrisma = function () {
  const state = { staffUser: [], auditLog: [], loginAttempt: [], notification: [], homeSettings: [], storeOrder: [], adoptionApplication: [], volunteer: [], caseReport: [], dog: [], reportImage: [] };
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
        if (orderBy) {
          const clauses = Array.isArray(orderBy) ? orderBy : [orderBy];
          rows.sort((a, b) => { for (const clause of clauses) { const [field, direction] = Object.entries(clause)[0]; if (a[field] > b[field]) return direction === 'desc' ? -1 : 1; if (a[field] < b[field]) return direction === 'desc' ? 1 : -1; } return 0; });
        }
        if (take) rows = rows.slice(0, take);
        return structuredClone(rows);
      },
      async findUnique({ where }) { return structuredClone(state[table].find(row => matches(row, where)) ?? null); },
      async create({ data }) {
        data = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
        if (state[table].some(row => row.id === data.id && data.id || row.email === data.email && data.email)) throw Error('unique conflict');
        const defaults = ['storeOrder', 'adoptionApplication', 'volunteer', 'caseReport', 'dog', 'reportImage'].includes(table) ? { id: require('node:crypto').randomUUID(), createdAt: new Date() } : {};
        if (['dog', 'adoptionApplication'].includes(table)) defaults.updatedAt = new Date();
        if (table === 'storeOrder') Object.assign(defaults, { status: 'Pendiente', paymentStatus: 'Pendiente', trackingNumber: '', department: '', shippingAddress: '', paymentReference: '', adminNotes: '', note: '' });
        if (table === 'adoptionApplication') Object.assign(defaults, { dogId: null, dogSnapshot: null, evaluatorNotes: null });
        if (table === 'caseReport') Object.assign(defaults, { adminNotes: '', photos: [] });
        if (table === 'dog') Object.assign(defaults, { isDeleted: false });
        const row = { ...defaults, ...(table === 'auditLog' ? { id: require('node:crypto').randomUUID(), at: new Date(), actorName: null, detail: null, ip: null } : {}), ...(table === 'notification' ? { id: require('node:crypto').randomUUID(), createdAt: new Date(), read: false, metadata: null } : {}), ...structuredClone(data) };
        state[table].push(row); return structuredClone(row);
      },
      async update({ where, data }) { const row = state[table].find(row => matches(row, where)); if (!row) throw Error('missing row'); Object.assign(row, structuredClone(data)); return structuredClone(row); },
      async upsert({ where, create, update }) { return state[table].some(row => matches(row, where)) ? this.update({ where, data: update }) : this.create({ data: create }); },
      async delete({ where }) { const index = state[table].findIndex(row => matches(row, where)); if (index === -1) throw Error('missing row'); return state[table].splice(index, 1)[0]; },
      async deleteMany({ where } = {}) { const before = state[table].length; state[table] = state[table].filter(row => !matches(row, where)); return { count: before - state[table].length }; },
      async updateMany({ where, data }) { const rows = state[table].filter(row => matches(row, where)); for (const row of rows) Object.assign(row, data); return { count: rows.length }; },
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
