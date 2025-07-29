export interface AdvertiserRating {
  id: string;
  activityId: string; // O link para a visita que permitiu a avaliação (essencial!)

  reviewerId: string; // Quem avaliou
  reviewerName: string; // Nome de quem avaliou

  advertiserId: string; // Quem FOI avaliado

  rating: number; // A nota geral de 1 a 5 estrelas para o serviço
  comment: string; // O comentário sobre o atendimento

  createdAt: string; // Data da avaliação
}
