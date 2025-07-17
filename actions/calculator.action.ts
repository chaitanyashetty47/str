"use server"

import { z } from "zod"
import prisma from "@/utils/prisma/prismaClient"
import { createClient } from "@/utils/supabase/server"

const bmiSchema = z.object({
  weight: z.coerce.number().min(30).max(200),
  height: z.coerce.number().min(100).max(250),
  date_logged: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date"),
})

export async function calculateBmiAction(prevState: any, formData: FormData) {
  // Parse form data
  const weight = Number(formData.get("weight"))
  const height = Number(formData.get("height"))
  const date_logged = formData.get("date_logged") as string

  // Validate
  const parse = bmiSchema.safeParse({ weight, height, date_logged })
  if (!parse.success) {
    return { error: parse.error.flatten().fieldErrors }
  }

  // Get user ID from Supabase session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { auth: ["User not authenticated"] } }
  }
  const user_id = user.id

  // Calculate BMI
  const heightInMeters = height / 100
  const bmi = Number((weight / (heightInMeters * heightInMeters)).toFixed(1))

  // Save to user_body_measurements
  const measurement = await prisma.user_body_measurements.create({
    data: {
      user_id,
      weight,
      height,
      date_logged: new Date(date_logged),
    },
  })

  // Save to user_metrics
  await prisma.user_metrics.create({
    data: {
      user_id,
      metric_type: "bmi_calculator",
      value: bmi,
      user_body_measurements_id: measurement.id,
    },
  })

  return { bmi }
}

export type BmiHistoryType = {
  value: number
  user_body_measurements: {
    date_logged: Date
  }
}


export async function getBMIfForDateAction(date: Date) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { auth: ["User not authenticated"] } }
  }
  const user_id = user.id

  try{

    const bmi = await prisma.user_metrics.findFirst({
      where: {
        user_id,
        metric_type: "bmi_calculator",
        user_body_measurements: {
          date_logged: date,
        },
      },
      select: {
        value: true,
      },
    })
    return { bmi }
  } catch (error) {
    console.error("Error fetching BMI for date:", error)
    return { error: { database: ["Error fetching BMI for date"] } }
  }

 
}

export async function getBmiHistoryAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: { auth: ["User not authenticated"] } }
  }
  const user_id = user.id

  try{
    const bmiHistory = await prisma.user_metrics.findMany({
      where: {
        user_id,
        metric_type: "bmi_calculator",
      },
      select: {
        value: true,
        user_body_measurements: {
          select: {
            date_logged: true,
          },
        },
      },
      orderBy: {
        user_body_measurements: {
          date_logged: "desc",
        },
      },
    })
    return { bmiHistory: bmiHistory as BmiHistoryType[] }
  } catch (error) {
    console.error("Error fetching BMI history:", error)
    
    return { error: { database: ["Error fetching BMI history"] } }
  }



 
  
  
}
