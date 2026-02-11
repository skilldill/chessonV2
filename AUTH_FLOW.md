# Схема авторизации в Chesson

## Общая архитектура

```mermaid
graph TB
    subgraph "Frontend (Client/Mobile)"
        A[Пользователь]
        B[LoginScreen]
        C[SignupScreen]
        D[VerifyEmailScreen]
        E[ForgotPasswordScreen]
        F[ResetPasswordScreen]
        G[ProfileScreen]
        H[HomeRedirect]
    end

    subgraph "API Endpoints"
        I[POST /api/auth/signup]
        J[POST /api/auth/login]
        K[GET /api/auth/me]
        L[POST /api/auth/verify-email]
        M[POST /api/auth/forgot-password]
        N[POST /api/auth/reset-password]
        O[POST /api/auth/logout]
    end

    subgraph "Backend Services"
        P[(MongoDB User)]
        Q[JWT Token Service]
        R[Email Service]
        S[Password Hash Service]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H

    B --> J
    C --> I
    D --> L
    E --> M
    F --> N
    H --> K
    G --> K

    I --> P
    I --> S
    I --> R
    J --> P
    J --> S
    J --> Q
    K --> Q
    K --> P
    L --> P
    M --> P
    M --> R
    N --> P
    N --> S
```

## Процесс регистрации (Signup)

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant FS as SignupScreen
    participant API as /api/auth/signup
    participant DB as MongoDB
    participant Email as Email Service
    participant SS as SignupSuccessScreen

    U->>FS: Вводит login, email, password
    FS->>API: POST {login, email, password}
    
    API->>API: Валидация данных
    API->>DB: Проверка уникальности login/email
    DB-->>API: Результат проверки
    
    alt Данные валидны и уникальны
        API->>API: hashPassword(password)
        API->>API: crypto.randomBytes(32) - токен верификации
        API->>DB: Создать User (emailVerified: false)
        DB-->>API: User создан
        API->>Email: sendVerificationEmail(token)
        Email-->>API: Email отправлен
        API-->>FS: {success: true, message: "..."}
        FS->>SS: Редирект на /signup-success
    else Ошибка валидации
        API-->>FS: {success: false, error: "..."}
        FS->>U: Показать ошибку
    end
```

## Процесс верификации email

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant Email as Email
    participant VS as VerifyEmailScreen
    participant API as /api/auth/verify-email
    participant DB as MongoDB
    participant PS as ProfileScreen

    Email->>U: Ссылка с токеном
    U->>VS: Переход по ссылке /verify-email?token=...
    VS->>API: POST {token}
    
    API->>DB: Найти User по emailVerificationToken
    DB-->>API: User найден
    
    alt Токен валиден
        API->>DB: Обновить User (emailVerified: true, token: undefined)
        DB-->>API: Обновлено
        API-->>VS: {success: true, message: "..."}
        VS->>VS: Показать успех
        VS->>PS: Редирект на /profile через 3 сек
    else Токен невалиден
        API-->>VS: {success: false, error: "Invalid token"}
        VS->>U: Показать ошибку
    end
```

## Процесс входа (Login)

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant LS as LoginScreen
    participant API as /api/auth/login
    participant DB as MongoDB
    participant JWT as JWT Service
    participant HR as HomeRedirect

    U->>LS: Вводит login, password
    LS->>API: POST {login, password}
    
    API->>DB: Найти User по login.toLowerCase()
    DB-->>API: User найден/не найден
    
    alt User не найден
        API-->>LS: {success: false, error: "Invalid login or password"}
        LS->>U: Показать ошибку
    else User найден
        API->>API: comparePassword(password, user.password)
        
        alt Пароль неверный
            API-->>LS: {success: false, error: "Invalid login or password"}
            LS->>U: Показать ошибку
        else Пароль верный
            API->>DB: Проверить emailVerified
            
            alt Email не подтвержден
                API-->>LS: {success: false, error: "Please verify email", requiresEmailVerification: true}
                LS->>U: Показать ошибку
            else Email подтвержден
                API->>JWT: createToken({userId, login})
                JWT-->>API: JWT токен
                API->>API: Set-Cookie: authToken=... (HttpOnly, 7 дней)
                API-->>LS: {success: true, user: {...}}
                LS->>HR: Редирект на /
                HR->>HR: Проверка auth через /api/auth/me
                HR->>U: Редирект на /profile (если авторизован)
            end
        end
    end
```

## Проверка авторизации (auth/me)

```mermaid
sequenceDiagram
    participant C as Компонент
    participant API as GET /api/auth/me
    participant JWT as JWT Service
    participant DB as MongoDB

    C->>API: GET (с credentials: "include")
    API->>API: Извлечь authToken из Cookie
    
    alt Токен отсутствует
        API-->>C: {success: false, error: "Not authenticated"}
        C->>C: Пользователь не авторизован
    else Токен присутствует
        API->>JWT: verifyToken(authToken)
        
        alt Токен невалиден/истек
            API-->>C: {success: false, error: "Invalid token"}
            C->>C: Пользователь не авторизован
        else Токен валиден
            JWT-->>API: {userId, login}
            API->>DB: Найти User по userId
            DB-->>API: User данные
            API-->>C: {success: true, user: {...}}
            C->>C: Пользователь авторизован
        end
    end
```

## Процесс восстановления пароля

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant FPS as ForgotPasswordScreen
    participant API as /api/auth/forgot-password
    participant DB as MongoDB
    participant Email as Email Service

    U->>FPS: Вводит email
    FPS->>API: POST {email}
    
    API->>DB: Найти User по email.toLowerCase()
    
    alt User не найден (безопасность)
        API-->>FPS: {success: true, message: "If user exists..."}
        FPS->>U: Показать успех (не раскрывая факт существования)
    else User найден
        API->>API: crypto.randomBytes(32) - resetToken
        API->>API: resetPasswordExpires = Date.now() + 3600000 (1 час)
        API->>DB: Сохранить resetToken и expires
        API->>Email: sendPasswordResetEmail(token)
        
        alt Email отправлен успешно
            Email-->>API: Успех
            API-->>FPS: {success: true, message: "If user exists..."}
            FPS->>U: Показать успех
        else Ошибка отправки email
            Email-->>API: Ошибка
            API->>DB: Очистить resetToken и expires
            API-->>FPS: {success: false, error: "Failed to send email"}
            FPS->>U: Показать ошибку
        end
    end
```

## Процесс сброса пароля

```mermaid
sequenceDiagram
    participant U as Пользователь
    participant Email as Email
    participant RPS as ResetPasswordScreen
    participant API as /api/auth/reset-password
    participant DB as MongoDB
    participant PS as Password Service
    participant LS as LoginScreen

    Email->>U: Ссылка с токеном
    U->>RPS: Переход по ссылке /reset-password?token=...
    U->>RPS: Вводит новый пароль
    RPS->>API: POST {token, newPassword}
    
    API->>API: Валидация пароля (min 6 символов)
    API->>DB: Найти User (resetPasswordToken === token AND resetPasswordExpires > now)
    
    alt Токен невалиден или истек
        API-->>RPS: {success: false, error: "Invalid or expired token"}
        RPS->>U: Показать ошибку
    else Токен валиден
        API->>PS: hashPassword(newPassword)
        PS-->>API: Хешированный пароль
        API->>DB: Обновить User (password, resetToken: undefined, expires: undefined)
        DB-->>API: Обновлено
        API-->>RPS: {success: true, message: "Password reset successfully"}
        RPS->>RPS: Показать успех
        RPS->>LS: Редирект на /login через 2 сек
    end
```

## Защита маршрутов (HomeRedirect)

```mermaid
flowchart TD
    A[Пользователь заходит на /] --> B[HomeRedirect компонент]
    B --> C[useAuthRedirect хук]
    C --> D[GET /api/auth/me]
    
    D --> E{Токен в Cookie?}
    E -->|Нет| F[Показать CreateRoomScreen]
    E -->|Да| G[JWT verifyToken]
    
    G --> H{Токен валиден?}
    H -->|Нет| F
    H -->|Да| I[Найти User в БД]
    
    I --> J{User найден?}
    J -->|Нет| F
    J -->|Да| K[Редирект на /profile]
    
    style K fill:#90EE90
    style F fill:#FFB6C1
```

## Хранение токенов

```mermaid
graph LR
    subgraph "JWT Token (authToken)"
        A[Header: alg: HS256]
        B[Payload: userId, login]
        C[Signature: HMAC SHA256]
    end
    
    subgraph "Cookie Storage"
        D[HttpOnly: true]
        E[Path: /]
        F[SameSite: Lax]
        G[Max-Age: 7 дней]
        H[Secure: в production]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
```

## Состояния пользователя

```mermaid
stateDiagram-v2
    [*] --> Неавторизован
    
    Неавторизован --> Регистрация: Signup
    Регистрация --> EmailНеПодтвержден: User создан
    EmailНеПодтвержден --> EmailПодтвержден: Verify Email
    EmailПодтвержден --> Авторизован: Login
    
    Неавторизован --> Авторизован: Login (если email подтвержден)
    
    Авторизован --> Неавторизован: Logout
    Авторизован --> Авторизован: Использование приложения
    
    Неавторизован --> ЗапросВосстановления: Forgot Password
    ЗапросВосстановления --> СбросПароля: Переход по ссылке
    СбросПароля --> Неавторизован: Пароль сброшен
```

## API Endpoints Summary

| Endpoint | Method | Описание | Требует Auth |
|----------|--------|----------|--------------|
| `/api/auth/signup` | POST | Регистрация нового пользователя | ❌ |
| `/api/auth/login` | POST | Вход в систему | ❌ |
| `/api/auth/me` | GET | Проверка текущего пользователя | ✅ (Cookie) |
| `/api/auth/verify-email` | POST | Подтверждение email | ❌ |
| `/api/auth/forgot-password` | POST | Запрос на восстановление пароля | ❌ |
| `/api/auth/reset-password` | POST | Сброс пароля с токеном | ❌ |
| `/api/auth/logout` | POST | Выход из системы | ✅ (Cookie) |
| `/api/auth/profile` | PUT | Обновление профиля | ✅ (Cookie) |

## Безопасность

1. **Пароли**: Хранятся в хешированном виде (bcrypt, 10 rounds)
2. **JWT токены**: Подписываются секретным ключом, срок действия 7 дней
3. **Cookies**: HttpOnly, SameSite=Lax, Secure в production
4. **Email верификация**: Обязательна перед входом
5. **Токены восстановления**: Действительны 1 час, одноразовые
6. **Защита от перечисления**: При forgot-password всегда одинаковый ответ
