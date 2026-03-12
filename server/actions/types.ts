export type ActionResult<T = undefined> =
  | {
      success: true;
      message?: string;
      data?: T;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return {
    success: false,
    error,
    fieldErrors,
  };
}

export function actionSuccess<T>(
  message?: string,
  data?: T,
): ActionResult<T> {
  return {
    success: true,
    message,
    data,
  };
}
