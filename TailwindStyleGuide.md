## 🎨 Tailwind Style Guide – AMA Accademia WebApp (Mobile First)

### 🔴 Colore sociale

```css
primary: #ef4d48;
```

Utilizzato per azioni principali, evidenziazioni, titoli.

---

### 🧱 Card base

```jsx
<div className="bg-white rounded-xl shadow-md p-4 space-y-1">
  {/* contenuto */}
</div>
```

---

### 🏷️ Titoli

```jsx
<h2 className="text-xl font-bold text-primary mb-4">
  Lista Allievi
</h2>
```

---

### 🔘 Pulsanti

#### ➕ Pulsante primario (azione principale: Modifica, Aggiungi, Salva)

```jsx
<button className="bg-primary text-white px-4 py-2 rounded shadow">
  ✏️ Modifica
</button>
```

#### 🔄 Pulsante secondario (Attiva / Disattiva)

```jsx
<button className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
  Attiva
</button>
```

#### ❌ Pulsante pericoloso (Elimina)

```jsx
<button className="bg-red-100 text-red-700 px-4 py-2 rounded">
  🗑️ Elimina
</button>
```

---

### ⚠️ Badge e status

#### "NON IN REGOLA"

```jsx
<span className="inline-block bg-red-500 text-white text-xs px-2 py-1 rounded">
  NON IN REGOLA
</span>
```

#### "Non attivo"

```jsx
<span className="text-xs px-2 py-1 rounded bg-gray-300">
  Non attivo
</span>
```

---

### 📅 Data iscrizione (formattata)

```jsx
<p className="text-sm text-gray-700">
  Iscritto il: {new Date(a.data_iscrizione).toLocaleDateString('it-IT')}
</p>
```

---

### 📱 Mobile layout

Tutti i contenitori devono avere padding interno:

```jsx
<div className="p-4">
  {/* contenuto */}
</div>
```

Usa `space-y-*` per distanziare le schede o sezioni verticali.

---

### ✅ Utility aggiuntive utili

* `text-sm`, `text-xs` → testi secondari
* `rounded-xl`, `shadow-md` → card
* `flex flex-wrap gap-2` → layout pulsanti responsive
* `w-full mt-1` → campi di input

---

Può essere esteso con componenti riutilizzabili in futuro (es. `<Card>`, `<Button>`, `<Badge>`).
