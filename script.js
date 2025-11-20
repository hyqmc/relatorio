document.addEventListener('DOMContentLoaded', () => {
    const uploadFile = document.getElementById('uploadFile');
    const formContainer = document.getElementById('form-container');
    const generatePromptBtn = document.getElementById('generatePrompt');
    const outputContainer = document.getElementById('output-container');
    const outputPrompt = document.getElementById('outputPrompt');
    const copyPromptBtn = document.getElementById('copyPrompt');
    const downloadTemplateBtn = document.getElementById('downloadTemplate');
    const descriptiveFields = document.getElementById('descriptive-fields');
    const patientNameInput = document.getElementById('patientName');
    const sessionDateInput = document.getElementById('sessionDate');
    const sessionNotesInput = document.getElementById('sessionNotes');
    
    // Novo botão para exportar tabela
    const exportTableBtn = document.createElement('button');
    exportTableBtn.id = 'exportTable';
    exportTableBtn.textContent = 'Exportar Tabela de Dados (CSV)';
    exportTableBtn.style.marginTop = '10px';
    exportTableBtn.style.display = 'none';
    outputContainer.appendChild(exportTableBtn);

    let categoriesData = [];
    let sessionData = {}; // Armazena os dados brutos coletados para prompt e exportação

    // Estrutura de modelo de dados (usada para o botão "Baixar Lista de Exemplo")
    const templateData = [
        {
            "category": "Abordagem Terapêutica",
            "type": "single",
            "description": "Selecione a abordagem teórica que guia a sessão. Esta informação ditará a linguagem e a perspectiva da análise gerada pela IA.",
            "items": ["TCC (Terapia Cognitivo-Comportamental)", "Psicanálise", "Terapia Humanista", "Terapia Sistêmica", "Análise do Comportamento"]
        },
        {
            "category": "Recursos e Técnicas Utilizadas",
            "type": "multiple",
            "description": "Selecione os recursos ou técnicas aplicadas durante a sessão, incluindo detalhes de aplicação se disponíveis.",
            "items": [
                {
                    "main": "Recursos gráficos (desenho, escrita)",
                    "sub": ["Desenho livre", "Mandalas", "Escrita terapêutica", "Brainstorming no papel"]
                },
                "Diário de Pensamentos",
                "Exercícios de Respiração",
                "Exposição (real ou imaginária)",
                "Role-playing",
                "Técnicas de relaxamento"
            ]
        },
        {
            "category": "Estado Inicial do Paciente",
            "type": "multiple",
            "description": "Marque as características observadas na chegada do paciente, para que a IA possa descrever a evolução ou contraste.",
            "items": ["Ansioso", "Calmo", "Agitado", "Triste", "Comunicação clara", "Distraído", "Com pouca expressão"]
        },
        {
            "category": "Observações da Sessão",
            "type": "textarea",
            "description": "Anote aqui observações detalhadas sobre o andamento da sessão, o comportamento do paciente, ou qualquer ponto relevante para o relatório.",
            "items": []
        }
    ];

    // --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO ---

    downloadTemplateBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(templateData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_lista_relatorio.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // A SEÇÃO CORRIGIDA PARA UPLOAD DE ARQUIVOS JSON
    uploadFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                // Tenta fazer o parse do JSON lido
                categoriesData = JSON.parse(e.target.result); 
                
                // Verifica se a estrutura carregada é um Array
                if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
                    throw new Error("O arquivo JSON deve ser uma lista (Array) não vazia de categorias.");
                }
                
                // Se tudo estiver OK, renderiza o formulário
                renderForm(categoriesData); 
                generatePromptBtn.style.display = 'block';
                descriptiveFields.style.display = 'block';
                outputContainer.style.display = 'none';
                setupAutoNavigation(); // Configura a navegação após o carregamento
            } catch (error) {
                alert(`Erro ao carregar o arquivo: ${error.message}. Verifique a sintaxe JSON e o formato da lista.`);
                console.error('Erro de parsing ou estrutura JSON:', error);
                
                // Limpa o formulário e reseta o estado
                formContainer.innerHTML = '<p id="loading-message">Carregue um arquivo JSON para começar.</p>';
                generatePromptBtn.style.display = 'none';
                descriptiveFields.style.display = 'none';
            }
        };
        reader.readAsText(file);
    });

    function renderForm(data) {
        formContainer.innerHTML = '';
        data.forEach(category => {
            const card = document.createElement('div');
            card.classList.add('category-card');
            
            card.innerHTML = `
                <h3>${category.category}</h3>
                <p class="description">${category.description}</p>
                <div class="options-container"></div>
            `;
            
            const optionsContainer = card.querySelector('.options-container');
            const name = category.category.replace(/\s+/g, '-').toLowerCase();
            
            if (category.type === 'textarea') {
                const textarea = document.createElement('textarea');
                textarea.id = `${name}-textarea`;
                textarea.name = name;
                textarea.rows = 5;
                textarea.placeholder = `Escreva suas observações para a categoria "${category.category}" aqui...`;
                optionsContainer.appendChild(textarea);
            } else {
                const inputType = category.type === 'single' ? 'radio' : 'checkbox';
                category.items.forEach(item => {
                    const optionDiv = document.createElement('div');
                    optionDiv.classList.add('option-item');
                    
                    const itemText = typeof item === 'object' ? item.main : item;
                    
                    if (typeof item === 'string') {
                        optionDiv.innerHTML = `
                            <input type="${inputType}" id="${name}-${itemText.replace(/\s+/g, '-')}" name="${name}" value="${itemText}">
                            <label for="${name}-${itemText.replace(/\s+/g, '-')}">${itemText}</label>
                        `;
                        optionsContainer.appendChild(optionDiv);
                    } else if (typeof item === 'object' && item.main && item.sub) {
                        optionDiv.innerHTML = `
                            <input type="checkbox" id="${name}-${itemText.replace(/\s+/g, '-')}" name="${name}" value="${itemText}">
                            <label for="${name}-${itemText.replace(/\s+/g, '-')}" class="main-label">${itemText}</label>
                            <div class="sub-options" id="${name}-${itemText.replace(/\s+/g, '-')}-sub"></div>
                        `;
                        optionsContainer.appendChild(optionDiv);
                        
                        const mainCheckbox = optionDiv.querySelector('input');
                        const subOptionsDiv = optionDiv.querySelector('.sub-options');
                        
                        item.sub.forEach(subItem => {
                            const subOption = document.createElement('label');
                            subOption.innerHTML = `<input type="checkbox" name="${name}-${itemText.replace(/\s+/g, '-')}-sub-item" value="${subItem}"> ${subItem}`;
                            subOptionsDiv.appendChild(subOption);
                        });

                        mainCheckbox.addEventListener('change', () => {
                            if (mainCheckbox.checked) {
                                subOptionsDiv.style.display = 'block';
                            } else {
                                subOptionsDiv.style.display = 'none';
                                subOptionsDiv.querySelectorAll('input').forEach(subInput => subInput.checked = false);
                            }
                        });
                    }
                });
            }
            formContainer.appendChild(card);
        });
    }

    // --- NAVEGAÇÃO AUTOMÁTICA ---
    
    function setupAutoNavigation() {
        // Coleta todos os campos que podem ser focados na ordem do DOM
        const focusableElements = Array.from(document.querySelectorAll(
            '#descriptive-fields input, #descriptive-fields textarea, #form-container input:not([type="checkbox"]):not([type="radio"]), #form-container textarea, #form-container input[type="radio"], #form-container input[type="checkbox"]'
        ));

        // Filtra para pegar apenas o primeiro radio/checkbox de cada grupo
        const uniqueFocusable = [];
        const seenNames = new Set();
        
        focusableElements.forEach(el => {
            const isRadioOrCheckbox = el.type === 'radio' || el.type === 'checkbox';
            const name = el.name;

            if (isRadioOrCheckbox) {
                if (!seenNames.has(name)) {
                    uniqueFocusable.push(el);
                    seenNames.add(name);
                }
            } else {
                uniqueFocusable.push(el);
            }
        });

        uniqueFocusable.forEach((element, index) => {
            element.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    // Impede o envio do formulário no Enter
                    e.preventDefault(); 
                    
                    // Lógica de navegação
                    const nextElement = uniqueFocusable[index + 1];
                    if (nextElement) {
                        nextElement.focus();
                        // Se o próximo for input de texto, seleciona o conteúdo para digitar mais rápido
                        if (nextElement.type === 'text' || nextElement.tagName === 'TEXTAREA') {
                             nextElement.select();
                        }
                    } else {
                        // Se for o último, foca no botão de gerar
                        generatePromptBtn.focus();
                    }
                }
            });
        });
    }


    // --- COLETA E GERAÇÃO DE PROMPT ---

    generatePromptBtn.addEventListener('click', () => {
        const selectedOptions = {};
        const descriptiveData = {};
        
        // 1. Coleta dados descritivos
        if (patientNameInput.value.trim()) descriptiveData['Nome do Paciente'] = patientNameInput.value.trim();
        if (sessionDateInput.value.trim()) descriptiveData['Data da Sessão'] = sessionDateInput.value.trim();
        if (sessionNotesInput.value.trim()) descriptiveData['Observações Adicionais (Gerais)'] = sessionNotesInput.value.trim();

        // 2. Coleta dados das categorias de seleção e textarea
        categoriesData.forEach(category => {
            const name = category.category.replace(/\s+/g, '-').toLowerCase();

            if (category.type === 'textarea') {
                const textareaValue = document.getElementById(`${name}-textarea`).value.trim();
                if (textareaValue) {
                    selectedOptions[category.category] = [textareaValue];
                }
            } else {
                const inputs = document.querySelectorAll(`input[name="${name}"]:checked`);
                const items = [];
                inputs.forEach(input => {
                    let itemValue = input.value;
                    const subInputs = document.querySelectorAll(`input[name="${name}-${itemValue.replace(/\s+/g, '-')}-sub-item"]:checked`);
                    
                    if (subInputs.length > 0) {
                        const subItems = Array.from(subInputs).map(subInput => subInput.value);
                        // Junta item principal e sub-itens para o PROMPT
                        itemValue += ` (Detalhes: ${subItems.join(', ')})`;
                    }
                    items.push(itemValue);
                });
                
                if (items.length > 0) {
                    selectedOptions[category.category] = items;
                }
            }
        });

        if (Object.keys(selectedOptions).length === 0 && Object.keys(descriptiveData).length === 0) {
            alert('Por favor, preencha pelo menos um campo ou selecione uma opção para gerar o relatório.');
            return;
        }

        // Armazena os dados para uso em outras funções (exportação)
        sessionData = { ...descriptiveData, ...selectedOptions };

        const promptText = buildPrompt(selectedOptions, descriptiveData);
        outputPrompt.value = promptText;
        outputContainer.style.display = 'block';
        exportTableBtn.style.display = 'block'; // Mostra o botão de exportar
    });

    // --- FUNÇÃO CORE: BUILD PROMPT (ATUALIZADA) ---

    function buildPrompt(options, descriptiveData) {
        // 1. System Prompt (Instrução de Função para a IA)
        let prompt = "Você é um assistente especializado em psicoterapia, com a tarefa de gerar um relatório de evolução de sessão. Sua resposta deve ser coesa, profissional, e seguir a estrutura de um relatório clínico (Ex: Observações Iniciais, Desenvolvimento, Conclusão/Plano). Baseie-se unicamente nos 'Dados da Sessão' fornecidos abaixo.\n\n";

        // 2. Título da Seção de Dados
        prompt += "--- DADOS DA SESSÃO ---\n\n";

        // 3. Dados Descritivos (Nome, Data, Notas Adicionais)
        for (const key in descriptiveData) {
            prompt += `- **${key}**: ${descriptiveData[key]}\n`;
        }

        // 4. Separação visual
        prompt += "\n--- CATEGORIAS E ITENS SELECIONADOS ---\n\n";

        // 5. Dados das Categorias (Seleções e Textareas)
        for (const category in options) {
            // Encontra o objeto da categoria nos dados carregados para obter a descrição
            const categoryObject = categoriesData.find(c => c.category === category);
            const description = categoryObject ? categoryObject.description : "Sem descrição fornecida.";
            const isTextarea = categoryObject && categoryObject.type === 'textarea';

            // Inclui a descrição da categoria como contexto
            prompt += `### ${category.toUpperCase()}\n`;
            prompt += `*Contexto para IA: ${description}*\n`;
            
            // Verifica se é um textarea (anotação) para formatar como bloco de texto
            if (options[category].length === 1 && isTextarea) {
                // Bloco de texto da anotação
                prompt += `${options[category][0]}\n\n`;
            } else {
                // Lista os itens selecionados ou opções únicas
                prompt += `Itens Selecionados: ${options[category].join('; ')}.\n\n`;
            }
        }

        // 6. Instrução Final e Formato de Saída
        prompt += "\n--- INSTRUÇÃO FINAL ---\n";
        prompt += "Gere o relatório completo utilizando uma linguagem clínica e integrando todos os pontos listados de forma orgânica. Inicie o relatório sem repetir o nome e a data da sessão. Priorize a coerência e o fluxo natural do texto.";

        return prompt;
    }

    // --- FUNÇÕES AUXILIARES ---

    copyPromptBtn.addEventListener('click', () => {
        outputPrompt.select();
        document.execCommand('copy');
        alert('Texto copiado para a área de transferência!');
    });

    // --- FUNÇÃO DE EXPORTAÇÃO DA TABELA (CSV) ---

    exportTableBtn.addEventListener('click', () => {
        if (Object.keys(sessionData).length === 0) {
            alert('Nenhum dado selecionado para exportar.');
            return;
        }

        let csv = "Categoria;Itens Selecionados\n";

        for (const category in sessionData) {
            const items = sessionData[category];
            let itemsString = Array.isArray(items) ? items.join(' | ') : items;
            
            // Remove quebras de linha e aspas duplas para evitar problemas com CSV
            itemsString = itemsString.replace(/"/g, '""').replace(/\n/g, ' '); 

            csv += `"${category}";"${itemsString}"\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        let filename = 'relatorio_dados';
        const date = sessionData['Data da Sessão'] || new Date().toISOString().slice(0, 10);
        const patientName = sessionData['Nome do Paciente'] ? sessionData['Nome do Paciente'].replace(/[^a-zA-Z0-9]/g, '_') : 'paciente';

        filename = `${date}_${patientName}_dados_sessao.csv`;
        
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('Tabela de dados exportada com sucesso!');
    });

    // Garante que a navegação seja configurada após o DOM inicial, embora será re-configurada após o upload
    setupAutoNavigation();
});
