/* $(document).ready(function() {
    $('#panel-link, #users-link, #products-link, #reports-link').on('click', function(e) {
        e.preventDefault();
        var linkId = $(this).attr('id');
        var contentId = linkId.replace('-link', '');

        $('#' + contentId).appendTo('#dynamic-content');
    });
}); */

$(document).ready(function() {
    let hash = window.location.hash;
    if (hash) {
        let linkId = hash.replace('#', '');
        let contentId = linkId.replace('-link', '');

        $('#dynamic-content > div').hide();
        $('#' + contentId).appendTo('#dynamic-content').show();
        $('#' + linkId).addClass('lp-active');
    } else {
        $('#users').appendTo('#dynamic-content').show();
    }

    $('#patients-link, #doctors-link, #appointments-link, #medicalProcedures-link, #medicalHistory-link').on('click', function(e) {
        e.preventDefault();
        let linkId = $(this).attr('id');
        let contentId = linkId.replace('-link', '');
        window.location.hash = linkId;

        $('#dynamic-content > div').hide();
        $('#' + contentId).appendTo('#dynamic-content').show();
        $('.nav-link.lp-active').removeClass('lp-active');
        $(this).addClass('lp-active');
    });
});

/* Поиск пользователей */
document.getElementById('userSearchBtn').addEventListener('click', function() {
    var userSearchName = document.getElementById('userSearchInput').value;
    fetch(`/search-user?name=${userSearchName}`)
        .then(response => response.json())
        .then(data => {
            const modalBody = document.querySelector('#userModal .modal-body');

            if (data.found) {
                modalBody.innerHTML = `
                    <p>ID: ${data.user.ID}</p>
                    <p>Никнейм: ${data.user.Username}</p>
                    <p>Почта: ${data.user.Email}</p>
                    <p>UID: ${data.user.UID}</p>
                    <p>Дата регистрации: ${data.user.RegistrationDate}</p>
                `;
            } else {
                modalBody.innerHTML = `<p>Пользователь с никнеймом ${userSearchName} не найден.</p>`;
            }
            var modal = new bootstrap.Modal(document.getElementById('userModal'));
            modal.show();
        })
        .catch(error => console.error('Ошибка:', error));
});

// Функция для отображения изображения товара по URL
function displayProductImage(product) {
    if (product && product.productImageUrl) {
        var imgElement = document.createElement('img');
        imgElement.src = product.productImageUrl;
        imgElement.alt = 'Product Image';
        imgElement.classList.add('rounded-top-2');
        imgElement.style.minWidth = "240px"

        // Вставка элемента изображения в карточку товара
        var cardHeader = document.querySelector('.card-header');
        if (cardHeader) {
            cardHeader.appendChild(imgElement);
        }
    }
}

/* Создание карточек товара */
$(document).ready(function() {
    // Загрузка категорий в выпадающий список
    $.get('/categories', function(data) {
        data.forEach(function(category) {
            $('#idCategory').append(`<option value="${category.idCategory}">${category.categoryName}</option>`);
        });
    });

    // Функция для загрузки товаров и отображения их на странице
    function loadProducts() {
        $.get('/products', function(products) {
            products.forEach(function(product) {
                // Получение имени категории по ID
                // var categoryName = $('#idCategory option:selected').text();
                // Создание HTML-элемента карточки товара
                var cardHTML = `
                    <li class="mix d-flex justify-content-center text-dark w-100 color-1 check1 radio2 option3">
                        <div class="card rounded-2">
                            <div class="card-header h-100 border-bottom-0 position-relative">
                                <div class="z-3 position-absolute rounded-2 p-1 m-1 bg-black bg-gradient" 
                                    style="backdrop-filter: blur(5px); --bs-bg-opacity: 0.1">
                                    <span class="text-white fs-6 fw-medium">${product.categoryId}</span>
                                </div>
                                <img src="${product.productImageUrl}" alt="${product.productName}" class="card-img-top">
                            </div>
                            <div class="card-body" style="height: 60%">
                                <div class="card-title">${product.productName}</div>
                                <div class="card-subtitle">${product.productDescription}</div>
                            </div>
                            <div class="card-footer d-flex justify-content-center border-0 rounded-2">
                                <div class="card-price">${product.price}<span class="text-dark"> ₽</span></div>
                            </div>
                        </div>
                    </li>
                `;

                // Добавление карточки товара на страницу
                $('.casss ul').append(cardHTML);
            });
        });
    }

    // Загрузка товаров при инициализации страницы
    loadProducts();

    // Обработка отправки формы
    $('#productForm').submit(function(event) {
        event.preventDefault();
        var formData = $(this).serialize();
        var url = $('#productId').val() ? '/edit-product' : '/create-product';

        // Отправка данных на сервер
        $.post(url, formData, function(response) {
            if (response.success) {
                // Перезагрузка товаров после добавления нового
                $('.casss ul').empty(); // Очистка списка товаров
                loadProducts(); // Повторная загрузка товаров

                alert('Товар успешно добавлен.');
                $('#exampleModal').modal('hide'); // Закрытие модального окна
                window.location.reload();
            } else {
                alert('При добавлении товара произошла ошибка.');
            }
        });
    });
});

/* Создание категорий товара */
// Загрузка категорий
function loadCategories() {
    $('#categoryList').empty();
    $.get('/categories', function(data) {
        data.forEach(function(category) {
            var li = `<li class="row text-dark p-3 mt-3 me-3" style="border-radius: .8em; background-color: var(--bg);">
                                <div class="col d-flex align-items-center">
                                    <span class="fs-6 me-2">${category.idCategory}.</span>
                                    <span class="fs-6">${category.categoryName}</span>
                                </div>
                                <div class="col d-flex justify-content-end">
                                    <button class="btn btn-success bg-gradient me-2" onclick="editCategory(${category.idCategory}, '${category.categoryName}')">Редактировать</button>
                                    <button class="btn btn-danger bg-gradient" onclick="deleteCategory(${category.idCategory})">Удалить</button>
                                </div>
                              </li>`;
            $('#categoryList').append(li);
        });
    });
}

// Загрузка категорий при загрузке страницы
$(document).ready(function() {
    loadCategories();
});

// Отправка формы для добавления категории
$('#categoryForm').submit(function(event) {
    event.preventDefault();
    var formData = $(this).serialize();
    $.post('/create-category', formData, function(response) {
        if (response.success) {
            loadCategories();
            $('#categoryForm')[0].reset();
            window.location.reload();
        } else {
            alert('Произошла ошибка при добавлении категории.');
        }
    });
});

// Отправка запроса на удаление категории
function deleteCategory(idCategory) {
    $.ajax({
        url: `/delete-category/${idCategory}`,
        type: 'DELETE',
        success: function(response) {
            if (response.success) {
                loadCategories();
                window.location.reload();
            } else {
                alert('Произошла ошибка при удалении категории.');
            }
        }
    });
}

// Функция для заполнения формы редактирования категории
function editCategory(idCategory, categoryName) {
    var newCategoryName = prompt('Введите новое имя категории:', categoryName);
    if (newCategoryName !== null) {
        var formData = { idCategory: idCategory, categoryName: newCategoryName };
        $.post('/edit-category', formData, function(response) {
            if (response.success) {
                loadCategories();
                window.location.reload();
            } else {
                alert('Произошла ошибка при изменении категории.');
            }
        });
    }
}