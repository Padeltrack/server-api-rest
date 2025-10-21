# 📝 Ejemplos Prácticos de Uso de i18n

Este archivo contiene ejemplos reales de cómo implementar i18n en tu código.

## 🎯 Ejemplo 1: Controller de Autenticación

**Antes (sin i18n):**
```typescript
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: 'El email es requerido'
      });
    }
    
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }
    
    const token = generateToken(user);
    
    return res.status(200).json({
      message: 'Inicio de sesión exitoso',
      data: { user, token }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error del servidor'
    });
  }
};
```

**Después (con i18n):**
```typescript
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email) {
      return res.status(400).json({
        message: req.t('auth.login.emailRequired')
        // ES: "El email es requerido"
        // EN: "Email is required"
        // PT: "O email é obrigatório"
      });
    }
    
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: req.t('auth.login.error')
        // ES: "Credenciales inválidas"
        // EN: "Invalid credentials"
        // PT: "Credenciais inválidas"
      });
    }
    
    const token = generateToken(user);
    
    return res.status(200).json({
      message: req.t('auth.login.success'),
      // ES: "Inicio de sesión exitoso"
      // EN: "Login successful"
      // PT: "Login bem-sucedido"
      data: { user, token }
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
      // ES: "Error del servidor"
      // EN: "Server error"
      // PT: "Erro do servidor"
    });
  }
};
```

## 🎯 Ejemplo 2: Controller con Interpolación

```typescript
export const createOrder = async (req: Request, res: Response) => {
  try {
    const order = await OrderModel.create({
      ...req.body,
      userId: req.user._id
    });
    
    // Enviar email con el idioma del usuario
    const userLanguage = req.language || 'es';
    await sendOrderConfirmationEmail(order, userLanguage);
    
    return res.status(201).json({
      message: req.t('orders.create.success'),
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};

// Función de email con i18n
const sendOrderConfirmationEmail = async (order: OrderModel, language: string) => {
  const t = getTranslation(language);
  
  await sendEmail({
    to: order.userEmail,
    subject: t('emails.orderConfirmation.subject'),
    // ES: "Confirmación de orden"
    // EN: "Order confirmation"
    // PT: "Confirmação de pedido"
    template: 'orderConfirmation',
    data: {
      title: t('emails.orderConfirmation.title'),
      message: t('emails.orderConfirmation.message'),
      orderNumber: order.orderNumber
    }
  });
};
```

## 🎯 Ejemplo 3: Validaciones con Zod e i18n

```typescript
import { z } from 'zod';

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, email, phone } = req.body;
    
    // Validaciones con mensajes traducidos
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        message: req.t('users.validation.nameRequired')
      });
    }
    
    if (!email) {
      return res.status(400).json({
        message: req.t('users.validation.emailRequired')
      });
    }
    
    // Email válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: req.t('users.validation.emailInvalid')
      });
    }
    
    const user = await UserModel.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { new: true }
    );
    
    return res.status(200).json({
      message: req.t('users.profile.updated'),
      // ES: "Perfil actualizado exitosamente"
      // EN: "Profile updated successfully"
      // PT: "Perfil atualizado com sucesso"
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};
```

## 🎯 Ejemplo 4: CRUD Completo con i18n

```typescript
// GET - Listar
export const getExams = async (req: Request, res: Response) => {
  try {
    const exams = await ExamModel.find();
    
    if (exams.length === 0) {
      return res.status(200).json({
        message: req.t('exams.list.empty'),
        // ES: "No hay exámenes disponibles"
        // EN: "No exams available"
        // PT: "Não há exames disponíveis"
        data: []
      });
    }
    
    return res.status(200).json({
      message: req.t('exams.list.loaded'),
      data: exams
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};

// POST - Crear
export const createExam = async (req: Request, res: Response) => {
  try {
    const exam = await ExamModel.create(req.body);
    
    return res.status(201).json({
      message: req.t('exams.create.success'),
      // ES: "Examen creado exitosamente"
      // EN: "Exam created successfully"
      // PT: "Exame criado com sucesso"
      data: exam
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};

// PUT - Actualizar
export const updateExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exam = await ExamModel.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!exam) {
      return res.status(404).json({
        message: req.t('exams.detail.notFound')
        // ES: "Examen no encontrado"
        // EN: "Exam not found"
        // PT: "Exame não encontrado"
      });
    }
    
    return res.status(200).json({
      message: req.t('exams.update.success'),
      data: exam
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};

// DELETE - Eliminar
export const deleteExam = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exam = await ExamModel.findByIdAndDelete(id);
    
    if (!exam) {
      return res.status(404).json({
        message: req.t('exams.detail.notFound')
      });
    }
    
    return res.status(200).json({
      message: req.t('exams.delete.success')
      // ES: "Examen eliminado exitosamente"
      // EN: "Exam deleted successfully"
      // PT: "Exame excluído com sucesso"
    });
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};
```

## 🎯 Ejemplo 5: Mensajes con Variables Dinámicas

```typescript
export const gradeExam = async (req: Request, res: Response) => {
  try {
    const { examId, score } = req.body;
    const passingScore = 70;
    
    const result = await ExamAnswerModel.create({
      examId,
      userId: req.user._id,
      score
    });
    
    if (score >= passingScore) {
      return res.status(200).json({
        message: req.t('exams.grade.passed', { score }),
        // ES: "¡Felicitaciones! Has aprobado con 85 puntos"
        // EN: "Congratulations! You passed with 85 points"
        // PT: "Parabéns! Você passou com 85 pontos"
        passed: true,
        data: result
      });
    } else {
      return res.status(200).json({
        message: req.t('exams.grade.failed', { score }),
        // ES: "No has alcanzado el puntaje mínimo. Obtuviste 50 puntos"
        // EN: "You did not reach the minimum score. You got 50 points"
        // PT: "Você não atingiu a pontuação mínima. Você obteve 50 pontos"
        passed: false,
        data: result
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: req.t('errors.serverError')
    });
  }
};
```

## 🎯 Ejemplo 6: Middleware de Autorización con i18n

```typescript
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: req.t('errors.unauthorized')
        // ES: "No tienes autorización para realizar esta acción"
        // EN: "You are not authorized to perform this action"
        // PT: "Você não está autorizado a realizar esta ação"
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: req.t('errors.forbidden')
        // ES: "Acceso prohibido"
        // EN: "Access forbidden"
        // PT: "Acesso proibido"
      });
    }
    
    next();
  };
};
```

## 🎯 Ejemplo 7: Helper de Error Handler con i18n

```typescript
export const handleControllerError = (error: any, req: Request, res: Response) => {
  console.error('Controller Error:', error);
  
  // Errores de MongoDB
  if (error.name === 'CastError') {
    return res.status(400).json({
      message: req.t('errors.badRequest')
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      message: req.t('errors.conflict')
      // ES: "Conflicto con el estado actual del recurso"
      // EN: "Conflict with current resource state"
      // PT: "Conflito com o estado atual do recurso"
    });
  }
  
  // Error genérico
  return res.status(500).json({
    message: req.t('errors.serverError')
  });
};

// Uso en controller
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.create(req.body);
    return res.status(201).json({
      message: req.t('users.create.success'),
      data: user
    });
  } catch (error) {
    return handleControllerError(error, req, res);
  }
};
```

## 🎯 Ejemplo 8: Testing con i18n

```typescript
import { translate } from '../shared/util/i18n.util';

describe('User Controller', () => {
  it('should return success message in Spanish', async () => {
    const message = translate('users.create.success', {}, 'es');
    expect(message).toBe('Usuario creado exitosamente');
  });
  
  it('should return success message in English', async () => {
    const message = translate('users.create.success', {}, 'en');
    expect(message).toBe('User created successfully');
  });
  
  it('should return success message in Portuguese', async () => {
    const message = translate('users.create.success', {}, 'pt');
    expect(message).toBe('Usuário criado com sucesso');
  });
});
```

## 📋 Checklist para Implementar i18n en un Controller

Cuando agregues i18n a un controller existente:

- [ ] Reemplazar todos los strings hardcodeados con `req.t('key')`
- [ ] Verificar que las keys existan en los 3 archivos JSON (es, en, pt)
- [ ] Usar interpolación para valores dinámicos
- [ ] Probar con los 3 idiomas usando `?lang=es|en|pt`
- [ ] Actualizar tests si existen
- [ ] Documentar nuevas keys si son importantes

## 🚀 Tips Finales

1. **Consistencia**: Usa el mismo patrón de keys en todo el proyecto
2. **Reutilización**: Usa `common.*` para mensajes generales
3. **Contexto**: Incluye suficiente contexto en la key (módulo.acción.resultado)
4. **Variables**: Usa `{{ variable }}` para valores dinámicos
5. **Fallback**: El sistema automáticamente usa español si falta una traducción

---

**¡Feliz codificación multi-idioma!** 🌍✨

