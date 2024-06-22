package main

import (
	"database/sql"
	"fmt"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
)

const (
	host     = "localhost"
	port     = 5432
	user     = "postgres"
	password = "postgres"
	dbname   = "medical_db"
)

var db *sql.DB

func init() {
	var err error

	psqlconn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err = sql.Open("postgres", psqlconn)
	if err != nil {
		log.Fatalf("Ошибка при открытии соединения с базой данных: %s", err.Error())
	}

	err = db.Ping()
	if err != nil {
		log.Fatalf("Ошибка при проверке соединения с базой данных: %s", err.Error())
	}

	fmt.Println("Успешное соединение с базой данных!")
}

func main() {
	r := gin.Default()

	store := cookie.NewStore([]byte("byte_secret_key"))
	r.Use(sessions.Sessions("session_token", store))

	// Защищенные маршруты
	//auth := r.Group("/").Use(AuthRequired())
	//{
	//	auth.GET("/home", HomeHandler)
	//}

	// Незащищенные маршруты
	r.GET("/", RootHandler)
	r.GET("/login", LoginHandler)
	r.POST("/login", LoginHandler)
	r.POST("/logout", LogoutHandler)
	r.GET("/check-session", CheckSessionHandler)
	r.GET("/error", NotFoundHandler)
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	r.Static("/static", "./static")

	fmt.Printf("Сервер запущен на: http://localhost:5000\n")
	err := r.Run(":5000")
	if err != nil {
		return
	}
}

func RootHandler(c *gin.Context) {
	if c.Request.URL.Path != "/" {
		c.JSON(http.StatusNotFound, gin.H{"error": "Страница не найдена"})
		return
	}

	err := CheckIfUserIsLoggedIn(c)
	if err != nil {
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.Status(http.StatusOK)
}

func CheckIfUserIsLoggedIn(c *gin.Context) error {
	session := sessions.Default(c)
	authenticated := session.Get("authenticated")
	if authenticated != nil && authenticated.(bool) {
		c.Redirect(http.StatusFound, "/home")
		return nil
	}

	c.Redirect(http.StatusFound, "/login")
	return nil
}

func HomeHandler(c *gin.Context) {
	tmpl, err := template.ParseFiles(filepath.Join("static", "html", "index.html"))
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "Ошибка при парсинге страницы"})
		return
	}

	err = tmpl.Execute(c.Writer, nil)
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{"status": "Ошибка при загрузке страницы"})
		return
	}
}

func LoginHandler(c *gin.Context) {
	var admin = "admin"
	var pass = "root"

	if c.Request.Method == "GET" {
		tmpl, err := template.ParseFiles(filepath.Join("static", "html", "login.html"))
		if err != nil {
			fmt.Println(err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "Ошибка при парсинге страницы"})
			return
		}

		err = tmpl.Execute(c.Writer, nil)
		if err != nil {
			fmt.Println(err)
			c.JSON(http.StatusInternalServerError, gin.H{"status": "Ошибка при загрузке страницы"})
			return
		}

		return
	}

	if c.Request.Method == "POST" {
		username := c.PostForm("username")
		password := c.PostForm("password")

		session := sessions.Default(c)

		if username == admin && password == pass {
			session.Set("authenticated", true)
			if err := session.Save(); err != nil {
				log.Println("Ошибка сохранения сессии:", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
				return
			}
			log.Printf("Логин и пароль: %s, %s", username, password)
			log.Println("Аутентификация пользователя выполнена успешно")
			c.Redirect(http.StatusFound, "/home")
		} else {
			log.Printf("Неверный логин или пароль: %s, %s", username, password)
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Неверный логин или пароль"})
		}
		return
	} else {
		log.Println("Ошибка аутентификации пользователя")
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Неверные учетные данные"})
		return
	}
}

func LogoutHandler(c *gin.Context) {
	session := sessions.Default(c)

	session.Delete("authenticated")
	if err := session.Save(); err != nil {
		log.Println("Ошибка при сохранении сессии:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Внутренняя ошибка сервера"})
		return
	}

	log.Println("Выход из системы выполнен успешно")
	c.Redirect(http.StatusFound, "/login")
}

func CheckSessionHandler(c *gin.Context) {
	session := sessions.Default(c)
	if session.Get("authenticated") == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Сессия не найдена"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Сессия активна"})
	}
}

func NotFoundHandler(c *gin.Context) {
	c.HTML(http.StatusNotFound, "error.html", nil)
}
