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

    let categoriesData = [];

    const templateData = [
        {
            "category": "Abordagem Terapêutica",
            "type": "single",
            "description": "Selecione a abordagem teórica que guia a sessão.",
            "items": ["TCC (Terapia Cognitivo-Comportamental)", "Psicanálise", "Terapia Humanista", "Terapia Sistêmica", "Análise do Comportamento"]
        },
        {
            "category": "Recursos e Técnicas Utilizadas",
            "type": "multiple",
            "description": "Selecione os recursos ou técnicas aplicadas durante a sessão.",
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
            "description": "Marque as características observadas na chegada do paciente.",
            "items": ["Ansioso", "Calmo", "Agitado", "Triste", "Comunicação clara", "Distraído", "Com pouca expressão"]
        },
        {
            "category": "Principais Temas Abordados",
            "type": "multiple",
            "description": "Quais foram os temas centrais discutidos na sessão?",
            "items": ["Relacionamentos interpessoais", "Problemas no trabalho/estudo", "Autoconhecimento", "Transtornos de ansiedade", "Questões familiares", "Sentimentos de culpa", "Luto", "Autoestima"]
        },
        {
            "category": "Evolução da Sessão",
            "type": "single",
            "description": "Como você avalia a evolução do paciente durante a sessão?",
            "items": ["Houve avanço significativo", "Houve algum avanço", "O avanço foi limitado", "O paciente mostrou resistência"]
        }
    ];

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
            const inputType = category.type === 'single' ? 'radio' : 'checkbox';
            const name = category.category.replace(/\s+/g, '-').toLowerCase();

            category.items.forEach(item => {
                const optionDiv = document.createElement('div');
                optionDiv.classList.add('option-item');
                
                if (typeof item === 'string') {
                    optionDiv.innerHTML = `
                        <input type="${inputType}" id="${name}-${item}" name="${name}" value="${item}">
                        <label for="${name}-${item}">${item}</label>
                    `;
                    optionsContainer.appendChild(optionDiv);
                } else if (typeof item === 'object' && item.main && item.sub) {
                    optionDiv.innerHTML = `
                        <input type="checkbox" id="${name}-${item.main}" name="${name}" value="${item.main}">
                        <label for="${name}-${item.main}">${item.main}</label>
                        <div class="sub-options" id="${name}-${item.main}-sub"></div>
                    `;
                    optionsContainer.appendChild(optionDiv);
                    
                    const mainCheckbox = optionDiv.querySelector('input');
                    const subOptionsDiv = optionDiv.querySelector('.sub-options');
                    
                    item.sub.forEach(subItem => {
                        const subOption = document.createElement('label');
                        subOption.innerHTML = `<input type="checkbox" name="${name}-${item.main}-sub-item" value="${subItem}"> ${subItem}`;
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
            
            formContainer.appendChild(card);
        });
    }

    generatePromptBtn.addEventListener('click', () => {
        const selectedOptions = {};
        categoriesData.forEach(category => {
            const name = category.category.replace(/\s+/g, '-').toLowerCase();
            const inputs = document.querySelectorAll(`input[name="${name}"]:checked`);
            
            const items = [];
            inputs.forEach(input => {
                let itemValue = input.value;
                const subInputs = document.querySelectorAll(`input[name="${name}-${itemValue}-sub-item"]:checked`);
                
                if (subInputs.length > 0) {
                    const subItems = Array.from(subInputs).map(subInput => subInput.value);
                    itemValue += ` (${subItems.join(', ')})`;
                }
                items.push(itemValue);
            });
            
            if (items.length > 0) {
                selectedOptions[category.category] = items;
            }
        });

        const patientName = patientNameInput.value.trim();
        const sessionDate = sessionDateInput.value.trim();
        const sessionNotes = sessionNotesInput.value.trim();

        if (Object.keys(selectedOptions).length === 0 && !patientName && !sessionDate && !sessionNotes) {
            alert('Por favor, preencha pelo menos um campo ou selecione uma opção para gerar o relatório.');
            return;
        }

        const promptText = buildPrompt(selectedOptions, patientName, sessionDate, sessionNotes);
        outputPrompt.value = promptText;
        outputContainer.style.display = 'block';
    });

    function buildPrompt(options, patientName, sessionDate, sessionNotes) {
        let prompt = "Crie um relatório de sessão terapêutica detalhado, coeso e profissional. Utilize a estrutura de um relatório padrão (observações iniciais, descrição da sessão, etc.). Baseie-se nas seguintes informações:\n\n";

        if (patientName) {
            prompt += `- **Nome do Paciente**: ${patientName}\n`;
        }
        if (sessionDate) {
            prompt += `- **Data da Sessão**: ${sessionDate}\n`;
        }
        
        for (const category in options) {
            const items = options[category];
            prompt += `- **${category}**: ${items.join(', ')}.\n`;
        }
        
        if (sessionNotes) {
            prompt += `- **Observações Adicionais**: ${sessionNotes}\n`;
        }

        prompt += "\nPor favor, adapte o texto para que flua de forma natural, integrando esses pontos de maneira orgânica e evolutiva. Não se limite a apenas listar os itens, crie um texto descritivo e explicativo para cada tópico, de forma que o relatório tenha sentido e coerência.";

        return prompt;
    }

    copyPromptBtn.addEventListener('click', () => {
        outputPrompt.select();
        document.execCommand('copy');
        alert('Texto copiado para a área de transferência!');
    });
});
