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

    uploadFile.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                categoriesData = JSON.parse(e.target.result);
                renderForm(categoriesData);
                generatePromptBtn.style.display = 'block';
                descriptiveFields.style.display = 'block';
                outputContainer.style.display = 'none';
                setupAutoNavigation(); // Configura a navegação após o carregamento
            } catch (error) {
                alert('Erro ao carregar o arquivo. Certifique-se de que é um JSON válido.');
                console.error('Erro de parsing JSON:', error);
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
            
            // Adiciona evento para pular após preenchimento completo de campos de texto
            if (element.type === 'text' || element.tagName === 'TEXTAREA') {
                 element.addEventListener('blur', () => {
                    // Opcional: Se preenchido, pula para o próximo no evento blur
                    // Isso é útil para campos de texto, mas a navegação primária é pelo Enter
                 });
            }
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
